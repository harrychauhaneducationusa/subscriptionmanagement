import { Queue } from 'bullmq'
import { getRedisConnection } from '../config/redis.js'

const connection = getRedisConnection()

export const queues = {
  aggregationLifecycle: connection
    ? new Queue('aggregation_lifecycle', { connection })
    : null,
  transactionIngestion: connection
    ? new Queue('transaction_ingestion', { connection })
    : null,
  transactionNormalization: connection
    ? new Queue('transaction_normalization', { connection })
    : null,
  recurringDetection: connection
    ? new Queue('recurring_detection', { connection })
    : null,
  notificationDispatch: connection
    ? new Queue('notification_dispatch', { connection })
    : null,
}
