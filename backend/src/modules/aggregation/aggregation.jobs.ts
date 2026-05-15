import { logger } from '../../config/logger.js'
import { queues } from '../../queues/registry.js'
import {
  completeInstitutionLinkSync,
  processConsentCallback,
  startInstitutionLinkSync,
} from './aggregation.store.js'
import { enqueueTransactionJob } from '../transactions/transactions.jobs.js'
import type { ConsentCallbackEvent } from './providers/provider.types.js'

export type AggregationLifecycleJob =
  | {
      type: 'consent.callback'
      consentId: string
      eventType: ConsentCallbackEvent
    }
  | {
      type: 'link.refresh'
      householdId: string
      linkId: string
    }
  | {
      type: 'link.repair'
      householdId: string
      linkId: string
    }

const queueRetention = {
  removeOnComplete: 100,
  removeOnFail: 100,
} as const

export async function enqueueAggregationLifecycleJob(job: AggregationLifecycleJob) {
  if (queues.aggregationLifecycle) {
    const jobOptions =
      job.type === 'consent.callback'
        ? {
            ...queueRetention,
            jobId: `agg:consent-callback:${job.consentId}:${job.eventType}`,
          }
        : queueRetention

    await queues.aggregationLifecycle.add(job.type, job, jobOptions)

    return {
      accepted: true,
      mode: 'queued' as const,
    }
  }

  await processAggregationLifecycleJob(job)

  return {
    accepted: true,
    mode: 'inline' as const,
  }
}

export async function processAggregationLifecycleJob(job: AggregationLifecycleJob) {
  logger.info({ jobType: job.type }, 'Processing aggregation lifecycle job')

  switch (job.type) {
    case 'consent.callback': {
      const result = await processConsentCallback(job.consentId, job.eventType)

      if (
        job.eventType === 'consent.approved' &&
        result?.transition === 'applied' &&
        result.link.id
      ) {
        await enqueueTransactionJob({
          type: 'link.ingest',
          linkId: result.link.id,
        })
      }

      return result
    }
    case 'link.refresh': {
      await startInstitutionLinkSync(job.householdId, job.linkId, 'refresh')
      const result = await completeInstitutionLinkSync(job.householdId, job.linkId, {
        succeededAt: new Date().toISOString(),
      })

      if (result?.id) {
        await enqueueTransactionJob({
          type: 'link.ingest',
          linkId: result.id,
        })
      }

      return result
    }
    case 'link.repair': {
      await startInstitutionLinkSync(job.householdId, job.linkId, 'repair')
      const result = await completeInstitutionLinkSync(job.householdId, job.linkId, {
        succeededAt: new Date().toISOString(),
      })

      if (result?.id) {
        await enqueueTransactionJob({
          type: 'link.ingest',
          linkId: result.id,
        })
      }

      return result
    }
    default:
      return null
  }
}
