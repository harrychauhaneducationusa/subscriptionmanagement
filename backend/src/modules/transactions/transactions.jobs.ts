import { logger } from '../../config/logger.js'
import { queues } from '../../queues/registry.js'
import { enqueueRecurringDetectionJob } from '../recurring/recurring.jobs.js'
import { scheduleNextRunAfterIngestSuccess } from '../sync/linkSyncSchedule.store.js'
import { ingestTransactionsForLink, normalizeRawTransactions } from './transactions.store.js'

export type TransactionJob =
  | {
      type: 'link.ingest'
      linkId: string
    }
  | {
      type: 'raw.normalize'
      rawTransactionIds: string[]
    }

export async function enqueueTransactionJob(job: TransactionJob) {
  if (job.type === 'link.ingest' && queues.transactionIngestion) {
    try {
      await queues.transactionIngestion.add(job.type, job, {
        removeOnComplete: 100,
        removeOnFail: 100,
      })

      return {
        accepted: true,
        mode: 'queued' as const,
      }
    } catch (error) {
      logger.warn({ error, jobType: job.type }, 'transaction ingestion queue enqueue failed; processing inline')
    }
  }

  if (job.type === 'raw.normalize' && queues.transactionNormalization) {
    try {
      await queues.transactionNormalization.add(job.type, job, {
        removeOnComplete: 100,
        removeOnFail: 100,
      })

      return {
        accepted: true,
        mode: 'queued' as const,
      }
    } catch (error) {
      logger.warn({ error, jobType: job.type }, 'transaction normalization queue enqueue failed; processing inline')
    }
  }

  await processTransactionJob(job)

  return {
    accepted: true,
    mode: 'inline' as const,
  }
}

export async function processTransactionJob(job: TransactionJob) {
  logger.info({ jobType: job.type }, 'Processing transaction job')

  switch (job.type) {
    case 'link.ingest': {
      const result = await ingestTransactionsForLink(job.linkId)

      if (result) {
        await scheduleNextRunAfterIngestSuccess(job.linkId)
      }

      if (result && result.insertedRawTransactionIds.length > 0) {
        await enqueueTransactionJob({
          type: 'raw.normalize',
          rawTransactionIds: result.insertedRawTransactionIds,
        })
      }

      return result
    }
    case 'raw.normalize':
      const normalizedIds = await normalizeRawTransactions(job.rawTransactionIds)

      if (normalizedIds.length > 0) {
        await enqueueRecurringDetectionJob({
          type: 'normalized.detectRecurring',
          normalizedTransactionIds: normalizedIds,
        })
      }

      return normalizedIds
    default:
      return null
  }
}
