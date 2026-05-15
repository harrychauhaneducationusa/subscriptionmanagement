import { logger } from '../../config/logger.js'
import { queues } from '../../queues/registry.js'
import { generateCandidatesFromNormalizedTransactions } from './candidates.store.js'

export type RecurringDetectionJob = {
  type: 'normalized.detectRecurring'
  normalizedTransactionIds: string[]
}

export async function enqueueRecurringDetectionJob(job: RecurringDetectionJob) {
  if (queues.recurringDetection) {
    try {
      await queues.recurringDetection.add(job.type, job, {
        removeOnComplete: 100,
        removeOnFail: 100,
      })

      return {
        accepted: true,
        mode: 'queued' as const,
      }
    } catch (error) {
      logger.warn({ error, jobType: job.type }, 'recurring detection queue enqueue failed; processing inline')
    }
  }

  await processRecurringDetectionJob(job)

  return {
    accepted: true,
    mode: 'inline' as const,
  }
}

export async function processRecurringDetectionJob(job: RecurringDetectionJob) {
  logger.info({ jobType: job.type }, 'Processing recurring detection job')

  switch (job.type) {
    case 'normalized.detectRecurring':
      return generateCandidatesFromNormalizedTransactions(job.normalizedTransactionIds)
    default:
      return []
  }
}
