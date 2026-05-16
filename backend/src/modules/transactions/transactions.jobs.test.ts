import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../queues/registry.js', () => ({
  queues: {
    transactionIngestion: undefined,
    transactionNormalization: undefined,
    aggregationLifecycle: undefined,
    recurringDetection: undefined,
    notificationDispatch: undefined,
  },
}))

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

const scheduleNextRunAfterIngestSuccess = vi.hoisted(() => vi.fn())

vi.mock('../sync/linkSyncSchedule.store.js', () => ({
  scheduleNextRunAfterIngestSuccess,
}))

import { processTransactionJob } from './transactions.jobs.js'

describe('processTransactionJob', () => {
  beforeEach(() => {
    ingestTransactionsForLink.mockReset()
    normalizeRawTransactions.mockReset()
    enqueueRecurringDetectionJob.mockReset()
    scheduleNextRunAfterIngestSuccess.mockReset()
  })

  it('link.ingest chains to raw.normalize when rows were inserted', async () => {
    ingestTransactionsForLink.mockResolvedValueOnce({
      ingestionBatchId: 'ing_1',
      insertedRawTransactionIds: ['rtx_a', 'rtx_b'],
    })
    normalizeRawTransactions.mockResolvedValueOnce(['ntx_1'])

    const result = await processTransactionJob({ type: 'link.ingest', linkId: 'lnk_1' })

    expect(ingestTransactionsForLink).toHaveBeenCalledWith('lnk_1')
    expect(normalizeRawTransactions).toHaveBeenCalledWith(['rtx_a', 'rtx_b'])
    expect(enqueueRecurringDetectionJob).toHaveBeenCalledWith({
      type: 'normalized.detectRecurring',
      normalizedTransactionIds: ['ntx_1'],
    })
    expect(result).toEqual({ ingestionBatchId: 'ing_1', insertedRawTransactionIds: ['rtx_a', 'rtx_b'] })
    expect(scheduleNextRunAfterIngestSuccess).toHaveBeenCalledWith('lnk_1')
  })

  it('link.ingest skips normalize when nothing inserted', async () => {
    ingestTransactionsForLink.mockResolvedValueOnce({
      ingestionBatchId: 'ing_2',
      insertedRawTransactionIds: [],
    })

    await processTransactionJob({ type: 'link.ingest', linkId: 'lnk_2' })

    expect(normalizeRawTransactions).not.toHaveBeenCalled()
    expect(enqueueRecurringDetectionJob).not.toHaveBeenCalled()
    expect(scheduleNextRunAfterIngestSuccess).toHaveBeenCalledWith('lnk_2')
  })

  it('link.ingest does not bump schedule when ingest returns null', async () => {
    ingestTransactionsForLink.mockResolvedValueOnce(null)

    await processTransactionJob({ type: 'link.ingest', linkId: 'lnk_missing' })

    expect(scheduleNextRunAfterIngestSuccess).not.toHaveBeenCalled()
  })

  it('raw.normalize enqueues recurring detection when normalized ids exist', async () => {
    normalizeRawTransactions.mockResolvedValueOnce(['ntx_2', 'ntx_3'])

    const out = await processTransactionJob({ type: 'raw.normalize', rawTransactionIds: ['rtx_x'] })

    expect(normalizeRawTransactions).toHaveBeenCalledWith(['rtx_x'])
    expect(enqueueRecurringDetectionJob).toHaveBeenCalledWith({
      type: 'normalized.detectRecurring',
      normalizedTransactionIds: ['ntx_2', 'ntx_3'],
    })
    expect(out).toEqual(['ntx_2', 'ntx_3'])
    expect(scheduleNextRunAfterIngestSuccess).not.toHaveBeenCalled()
  })

  it('raw.normalize skips recurring job when normalize returns empty', async () => {
    normalizeRawTransactions.mockResolvedValueOnce([])

    await processTransactionJob({ type: 'raw.normalize', rawTransactionIds: ['rtx_y'] })

    expect(enqueueRecurringDetectionJob).not.toHaveBeenCalled()
    expect(scheduleNextRunAfterIngestSuccess).not.toHaveBeenCalled()
  })
})
