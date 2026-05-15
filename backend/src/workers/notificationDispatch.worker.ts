import { Worker } from 'bullmq'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import {
  processNotificationDispatchJob,
  type NotificationDispatchJob,
} from '../modules/notifications/notifications.jobs.js'

export function startNotificationDispatchWorker() {
  const connection = getRedisConnection()

  if (!connection) {
    logger.info('Notification dispatch worker skipped because Redis is not configured')
    return null
  }

  const worker = new Worker<NotificationDispatchJob>(
    'notification_dispatch',
    async (job) => processNotificationDispatchJob(job.data),
    { connection },
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Notification dispatch job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        error,
      },
      'Notification dispatch job failed',
    )
  })

  return worker
}
