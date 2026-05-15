import { Worker } from 'bullmq'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import {
  processAggregationLifecycleJob,
  type AggregationLifecycleJob,
} from '../modules/aggregation/aggregation.jobs.js'

export function startAggregationLifecycleWorker() {
  const connection = getRedisConnection()

  if (!connection) {
    logger.info('Aggregation lifecycle worker skipped because Redis is not configured')
    return null
  }

  const worker = new Worker<AggregationLifecycleJob>(
    'aggregation_lifecycle',
    async (job) => processAggregationLifecycleJob(job.data),
    { connection },
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Aggregation lifecycle job completed')
  })

  worker.on('failed', (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        error,
      },
      'Aggregation lifecycle job failed',
    )
  })

  return worker
}
