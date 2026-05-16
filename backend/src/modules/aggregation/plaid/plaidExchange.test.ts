import { beforeEach, describe, expect, it, vi } from 'vitest'

const getConsentState = vi.hoisted(() => vi.fn())
const setConsentPlaidCredentials = vi.hoisted(() => vi.fn())
const processConsentCallback = vi.hoisted(() => vi.fn())
const upsertPlaidBankAccounts = vi.hoisted(() => vi.fn())
const exchangePlaidPublicToken = vi.hoisted(() => vi.fn())
const getPlaidApiClient = vi.hoisted(() => vi.fn())
const enqueueAggregationLifecycleJob = vi.hoisted(() => vi.fn())

vi.mock('../aggregation.store.js', () => ({
  getConsentState,
  setConsentPlaidCredentials,
  processConsentCallback,
  upsertPlaidBankAccounts,
}))

vi.mock('./plaidClient.js', () => ({
  exchangePlaidPublicToken,
  getPlaidApiClient,
}))

vi.mock('../aggregation.jobs.js', () => ({
  enqueueAggregationLifecycleJob,
}))

import { completePlaidLinkExchange } from './plaidExchange.js'

describe('completePlaidLinkExchange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when consent is missing', async () => {
    getConsentState.mockResolvedValue(null)

    await expect(
      completePlaidLinkExchange({
        householdId: 'hh',
        consentId: 'con_x',
        publicToken: 'pub',
      }),
    ).rejects.toMatchObject({ code: 'CONSENT_NOT_FOUND' })
  })

  it('throws when provider is not plaid', async () => {
    getConsentState.mockResolvedValue({
      consent: { id: 'c1', provider: 'setu_aa' },
      link: { id: 'l1' },
    })

    await expect(
      completePlaidLinkExchange({ householdId: 'hh', consentId: 'con_x', publicToken: 'pub' }),
    ).rejects.toMatchObject({ code: 'CONSENT_PROVIDER_MISMATCH' })
  })

  it('exchanges token, loads accounts, upserts, enqueues refresh', async () => {
    getConsentState.mockResolvedValue({
      consent: { id: 'c1', provider: 'plaid' },
      link: { id: 'l1' },
    })
    exchangePlaidPublicToken.mockResolvedValue({ accessToken: 'at', itemId: 'item_1' })
    getPlaidApiClient.mockReturnValue({
      accountsGet: vi.fn().mockResolvedValue({
        data: {
          accounts: [{ account_id: 'acc1', name: 'Checking', mask: '1234', subtype: 'checking' }],
        },
      }),
    })
    processConsentCallback.mockResolvedValue({
      transition: 'applied',
      consent: { id: 'c1', provider: 'plaid' },
      link: { id: 'lnk_final' },
    })

    const result = await completePlaidLinkExchange({
      householdId: 'hh1',
      consentId: 'c1',
      publicToken: 'pub_t',
    })

    expect(setConsentPlaidCredentials).toHaveBeenCalledWith('c1', { itemId: 'item_1', accessToken: 'at' })
    expect(upsertPlaidBankAccounts).toHaveBeenCalled()
    expect(enqueueAggregationLifecycleJob).toHaveBeenCalledWith({
      type: 'link.refresh',
      householdId: 'hh1',
      linkId: 'lnk_final',
    })
    expect(result.accountsLinked).toBe(1)
    expect(result.itemId).toBe('item_1')
  })
})
