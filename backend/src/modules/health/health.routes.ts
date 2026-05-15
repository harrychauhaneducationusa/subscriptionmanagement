import { Router } from 'express'
import { checkDatabaseHealth } from '../../config/database.js'
import { metricsRegistry } from '../../config/metrics.js'
import { checkRedisHealth } from '../../config/redis.js'
import { ApiError, sendData, sendError } from '../../lib/http.js'
import { getLaunchReadinessAnalyticsSummary } from '../analytics/analytics.service.js'
import { getNotificationOperationalSummary } from '../notifications/notifications.store.js'
import { queues } from '../../queues/registry.js'

export const healthRouter = Router()

healthRouter.get('/health/live', (request, response) => {
  sendData(request, response, {
    status: 'live',
  })
})

healthRouter.get('/health/ready', async (request, response) => {
  const [database, redis] = await Promise.all([checkDatabaseHealth(), checkRedisHealth()])

  const databaseOk = database.status === 'not_configured' || database.status === 'available'
  const redisOk = redis.status === 'not_configured' || redis.status === 'available'

  if (!databaseOk || !redisOk) {
    sendError(
      request,
      response,
      new ApiError(503, 'NOT_READY', 'Required dependencies are not available', {
        database: database.status,
        redis: redis.status,
      }),
    )
    return
  }

  sendData(request, response, {
    status: 'ready',
    services: {
      database: database.status,
      redis: redis.status,
    },
  })
})

healthRouter.get('/health', async (request, response) => {
  const [database, redis] = await Promise.all([checkDatabaseHealth(), checkRedisHealth()])

  sendData(request, response, {
    status: 'ok',
    services: {
      api: 'available',
      database: database.status,
      redis: redis.status,
    },
  })
})

healthRouter.get('/metrics', async (_request, response) => {
  response.setHeader('Content-Type', metricsRegistry.contentType)
  response.send(await metricsRegistry.metrics())
})

healthRouter.get('/health/launch-readiness', async (request, response) => {
  const [database, redis, analytics, notifications, queueSnapshot] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    getLaunchReadinessAnalyticsSummary(),
    getNotificationOperationalSummary(),
    getQueueSnapshot(),
  ])

  sendData(request, response, {
    status: database.status === 'available' && redis.status === 'available' ? 'healthy' : 'degraded',
    services: {
      database: database.status,
      redis: redis.status,
    },
    analytics,
    notifications,
    queues: queueSnapshot,
  })
})

async function getQueueSnapshot() {
  const entries = await Promise.all(
    Object.entries(queues).map(async ([name, queue]) => {
      if (!queue) {
        return [name, null] as const
      }

      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')

      return [name, counts] as const
    }),
  )

  return Object.fromEntries(entries)
}
