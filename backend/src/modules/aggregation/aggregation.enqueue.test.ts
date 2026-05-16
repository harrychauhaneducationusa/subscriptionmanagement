import { beforeEach, describe, expect, it, vi } from 'vitest'

const processConsentCallback = vi.hoisted(() => vi.fn().mockResolvedValue(null))
const startInstitutionLinkSync = vi.hoisted(() => vi.fn())
const completeInstitutionLinkSync = vi.hoisted(() => vi.fn())
const enqueueTransactionJob = vi.hoisted(() => vi.fn())

vi.mock('./aggregation.store.js', () => ({
  processConsentCallback,
  startInstitutionLinkSync,
  completeInstitutionLinkSync,
}))

vi.mock('../transactions/transactions.jobs.js', () => ({
  enqueueTransactionJob,
}))

const queueAdd = vi.hoisted(() => vi.fn())

vi.mock('../../queues/registry.js', () => ({
  queues: {
    aggregationLifecycle: {
      add: queueAdd,
    },
  },
}))

import { enqueueAggregationLifecycleJob } from './aggregation.jobs.js'

describe('enqueueAggregationLifecycleJob', () => {
  beforeEach(() => {
    queueAdd.mockReset()
    queueAdd.mockResolvedValue(undefined)
    processConsentCallback.mockReset()
    processConsentCallback.mockResolvedValue(null)
  })

  it('returns queued mode when BullMQ add succeeds', async () => {
    const out = await enqueueAggregationLifecycleJob({
      type: 'consent.callback',
      consentId: 'con_1',
      eventType: 'consent.approved',
    })

    expect(out).toEqual({ accepted: true, mode: 'queued' })
    expect(queueAdd).toHaveBeenCalled()
    expect(processConsentCallback).not.toHaveBeenCalled()
  })

  it('falls back to inline processing when enqueue fails', async () => {
    queueAdd.mockRejectedValueOnce(new Error('redis down'))

    await enqueueAggregationLifecycleJob({
      type: 'consent.callback',
      consentId: 'con_2',
      eventType: 'consent.approved',
    })

    expect(processConsentCallback).toHaveBeenCalledWith('con_2', 'consent.approved')
  })
})
