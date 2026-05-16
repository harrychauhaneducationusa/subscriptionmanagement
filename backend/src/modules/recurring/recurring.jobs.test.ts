import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateCandidatesFromNormalizedTransactions = vi.hoisted(() => vi.fn())

vi.mock('./candidates.store.js', () => ({
  generateCandidatesFromNormalizedTransactions,
}))

vi.mock('../../queues/registry.js', () => ({
  queues: {
    recurringDetection: {
      add: vi.fn().mockRejectedValue(new Error('queue down')),
    },
  },
}))

import { processRecurringDetectionJob, enqueueRecurringDetectionJob } from './recurring.jobs.js'

describe('recurring.jobs', () => {
  beforeEach(() => {
    generateCandidatesFromNormalizedTransactions.mockReset()
  })

  it('processRecurringDetectionJob delegates to candidate generation', async () => {
    generateCandidatesFromNormalizedTransactions.mockResolvedValue([])
    const out = await processRecurringDetectionJob({
      type: 'normalized.detectRecurring',
      normalizedTransactionIds: ['n1'],
    })
    expect(generateCandidatesFromNormalizedTransactions).toHaveBeenCalledWith(['n1'])
    expect(out).toEqual([])
  })

  it('enqueueRecurringDetectionJob falls back to inline when queue add fails', async () => {
    generateCandidatesFromNormalizedTransactions.mockResolvedValue([])
    const result = await enqueueRecurringDetectionJob({
      type: 'normalized.detectRecurring',
      normalizedTransactionIds: ['n1'],
    })

    expect(result.mode).toBe('inline')
    expect(generateCandidatesFromNormalizedTransactions).toHaveBeenCalled()
  })
})
