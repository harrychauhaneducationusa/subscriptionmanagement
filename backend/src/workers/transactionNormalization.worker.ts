import { Worker } from 'bullmq'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import { processTransactionJob, type TransactionJob } from '../modules/transactions/transactions.jobs.js'

export function startTransactionNormalizationWorker() {
  const connection = getRedisConnection()

  if (!connection) {
    logger.info('Transaction normalization worker skipped because Redis is not configured')
    return null
  }

  const worker = new Worker<TransactionJob>(
    'transaction_normalization',
    async (job) => processTransactionJob(job.data),
    { connection },
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Transaction normalization job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, jobName: job?.name, error },
      'Transaction normalization job failed',
    )
  })

  return worker
}
