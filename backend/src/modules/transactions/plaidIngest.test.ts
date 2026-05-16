import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPlaidAccessTokenForLink = vi.hoisted(() => vi.fn())
const transactionsSync = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { added: [], has_more: false, next_cursor: '' },
  }),
)

vi.mock('../aggregation/aggregation.store.js', () => ({
  getPlaidAccessTokenForLink,
}))

vi.mock('../aggregation/plaid/plaidClient.js', () => ({
  getPlaidApiClient: vi.fn(() => ({ transactionsSync })),
}))

const poolQuery = vi.hoisted(() => vi.fn())

vi.mock('../../config/database.js', () => ({
  getDatabasePool: vi.fn(() => ({
    query: poolQuery,
  })),
}))

import { ingestPlaidTransactionsForLink } from './plaidIngest.js'

describe('ingestPlaidTransactionsForLink', () => {
  beforeEach(() => {
    getPlaidAccessTokenForLink.mockReset()
    poolQuery.mockReset()
    transactionsSync.mockClear()
  })

  it('returns empty batch when access token missing', async () => {
    getPlaidAccessTokenForLink.mockResolvedValue(null)

    const out = await ingestPlaidTransactionsForLink('lnk_any')

    expect(out?.insertedRawTransactionIds).toEqual([])
    expect(poolQuery).not.toHaveBeenCalled()
  })

  it('returns null when institution link missing', async () => {
    getPlaidAccessTokenForLink.mockResolvedValue('token')
    poolQuery.mockResolvedValueOnce({ rows: [] })

    const out = await ingestPlaidTransactionsForLink('lnk_missing')

    expect(out).toBeNull()
  })

  it('returns empty when no active bank accounts', async () => {
    getPlaidAccessTokenForLink.mockResolvedValue('token')
    poolQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'lnk1', household_id: 'h1', consent_id: 'c1', institution_name: 'Bank' }],
      })
      .mockResolvedValueOnce({ rows: [] })

    const out = await ingestPlaidTransactionsForLink('lnk1')

    expect(out?.insertedRawTransactionIds).toEqual([])
    expect(transactionsSync).not.toHaveBeenCalled()
  })

  it('syncs transactions and inserts raw rows for matched accounts', async () => {
    getPlaidAccessTokenForLink.mockResolvedValue('token')
    poolQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'lnk1', household_id: 'h1', consent_id: 'c1', institution_name: 'Bank' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'ba1',
            household_id: 'h1',
            institution_link_id: 'lnk1',
            provider_account_id: 'plaid_acc',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'rtx_1' }] })

    transactionsSync.mockResolvedValueOnce({
      data: {
        added: [
          {
            account_id: 'plaid_acc',
            transaction_id: 'txn_1',
            name: 'Cafe',
            amount: 4.5,
            date: '2026-05-01',
            personal_finance_category: { primary: 'FOOD_AND_DRINK' },
          },
        ],
        has_more: false,
        next_cursor: 'done',
      },
    })

    const out = await ingestPlaidTransactionsForLink('lnk1')

    expect(transactionsSync).toHaveBeenCalled()
    expect(out?.insertedRawTransactionIds).toEqual(['rtx_1'])
  })
})
