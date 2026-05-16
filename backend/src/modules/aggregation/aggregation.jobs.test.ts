import { beforeEach, describe, expect, it, vi } from 'vitest'

const processConsentCallback = vi.hoisted(() => vi.fn())
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

vi.mock('../../queues/registry.js', () => ({
  queues: { aggregationLifecycle: null },
}))

import { processAggregationLifecycleJob } from './aggregation.jobs.js'

describe('processAggregationLifecycleJob', () => {
  beforeEach(() => {
    processConsentCallback.mockReset()
    startInstitutionLinkSync.mockReset()
    completeInstitutionLinkSync.mockReset()
    enqueueTransactionJob.mockReset()
  })

  it('consent.approved enqueues link.ingest when transition applied', async () => {
    processConsentCallback.mockResolvedValue({
      transition: 'applied',
      consent: {},
      link: { id: 'lnk_1' },
    })

    await processAggregationLifecycleJob({
      type: 'consent.callback',
      consentId: 'con_1',
      eventType: 'consent.approved',
    })

    expect(enqueueTransactionJob).toHaveBeenCalledWith({ type: 'link.ingest', linkId: 'lnk_1' })
  })

  it('link.refresh completes sync and enqueues ingest', async () => {
    completeInstitutionLinkSync.mockResolvedValue({ id: 'lnk_2' })

    await processAggregationLifecycleJob({
      type: 'link.refresh',
      householdId: 'hh_1',
      linkId: 'lnk_2',
    })

    expect(startInstitutionLinkSync).toHaveBeenCalledWith('hh_1', 'lnk_2', 'refresh')
    expect(enqueueTransactionJob).toHaveBeenCalledWith({ type: 'link.ingest', linkId: 'lnk_2' })
  })

  it('link.repair path uses repair mode', async () => {
    completeInstitutionLinkSync.mockResolvedValue({ id: 'lnk_3' })

    await processAggregationLifecycleJob({
      type: 'link.repair',
      householdId: 'hh_1',
      linkId: 'lnk_3',
    })

    expect(startInstitutionLinkSync).toHaveBeenCalledWith('hh_1', 'lnk_3', 'repair')
  })
})
