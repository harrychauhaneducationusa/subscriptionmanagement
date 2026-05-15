import { Worker } from 'bullmq'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import {
  processRecurringDetectionJob,
  type RecurringDetectionJob,
} from '../modules/recurring/recurring.jobs.js'

export function startRecurringDetectionWorker() {
  const connection = getRedisConnection()

  if (!connection) {
    logger.info('Recurring detection worker skipped because Redis is not configured')
    return null
  }

  const worker = new Worker<RecurringDetectionJob>(
    'recurring_detection',
    async (job) => processRecurringDetectionJob(job.data),
    { connection },
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Recurring detection job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, jobName: job?.name, error }, 'Recurring detection job failed')
  })

  return worker
}
