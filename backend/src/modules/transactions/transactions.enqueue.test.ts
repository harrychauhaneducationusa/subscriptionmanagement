import { beforeEach, describe, expect, it, vi } from 'vitest'

const ingestTransactionsForLink = vi.hoisted(() => vi.fn())
const normalizeRawTransactions = vi.hoisted(() => vi.fn())
const enqueueRecurringDetectionJob = vi.hoisted(() => vi.fn())

vi.mock('./transactions.store.js', () => ({
  ingestTransactionsForLink,
  normalizeRawTransactions,
}))

vi.mock('../recurring/recurring.jobs.js', () => ({
  enqueueRecurringDetectionJob,
}))

const ingestAdd = vi.hoisted(() => vi.fn())
const normalizeAdd = vi.hoisted(() => vi.fn())

vi.mock('../../queues/registry.js', () => ({
  queues: {
    transactionIngestion: { add: ingestAdd },
    transactionNormalization: { add: normalizeAdd },
    aggregationLifecycle: undefined,
    recurringDetection: undefined,
    notificationDispatch: undefined,
  },
}))

import { enqueueTransactionJob } from './transactions.jobs.js'

describe('enqueueTransactionJob', () => {
  beforeEach(() => {
    ingestAdd.mockReset()
    normalizeAdd.mockReset()
    ingestAdd.mockResolvedValue(undefined)
    normalizeAdd.mockResolvedValue(undefined)
    ingestTransactionsForLink.mockReset()
    normalizeRawTransactions.mockReset()
    enqueueRecurringDetectionJob.mockReset()
    ingestTransactionsForLink.mockResolvedValue({
      ingestionBatchId: 'ing_x',
      insertedRawTransactionIds: [],
    })
  })

  it('returns queued mode when link.ingest add succeeds', async () => {
    const out = await enqueueTransactionJob({ type: 'link.ingest', linkId: 'lnk_1' })

    expect(out).toEqual({ accepted: true, mode: 'queued' })
    expect(ingestAdd).toHaveBeenCalled()
    expect(ingestTransactionsForLink).not.toHaveBeenCalled()
  })

  it('processes link.ingest inline when queue add fails', async () => {
    ingestAdd.mockRejectedValueOnce(new Error('queue unavailable'))

    await enqueueTransactionJob({ type: 'link.ingest', linkId: 'lnk_2' })

    expect(ingestTransactionsForLink).toHaveBeenCalledWith('lnk_2')
  })

  it('returns queued mode when raw.normalize add succeeds', async () => {
    const out = await enqueueTransactionJob({
      type: 'raw.normalize',
      rawTransactionIds: ['r1'],
    })

    expect(out).toEqual({ accepted: true, mode: 'queued' })
    expect(normalizeAdd).toHaveBeenCalled()
    expect(normalizeRawTransactions).not.toHaveBeenCalled()
  })

  it('processes raw.normalize inline when queue add fails', async () => {
    normalizeAdd.mockRejectedValueOnce(new Error('queue unavailable'))
    normalizeRawTransactions.mockResolvedValueOnce([])

    await enqueueTransactionJob({
      type: 'raw.normalize',
      rawTransactionIds: ['r2'],
    })

    expect(normalizeRawTransactions).toHaveBeenCalledWith(['r2'])
  })
})
