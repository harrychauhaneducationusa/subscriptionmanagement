import { Worker } from 'bullmq'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import { processTransactionJob, type TransactionJob } from '../modules/transactions/transactions.jobs.js'

export function startTransactionIngestionWorker() {
  const connection = getRedisConnection()

  if (!connection) {
    logger.info('Transaction ingestion worker skipped because Redis is not configured')
    return null
  }

  const worker = new Worker<TransactionJob>(
    'transaction_ingestion',
    async (job) => processTransactionJob(job.data),
    { connection },
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Transaction ingestion job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, jobName: job?.name, error }, 'Transaction ingestion job failed')
  })

  return worker
}
