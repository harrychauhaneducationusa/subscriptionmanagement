import { Router } from 'express'
import { checkDatabaseHealth } from '../../config/database.js'
import { metricsRegistry } from '../../config/metrics.js'
import { checkRedisHealth } from '../../config/redis.js'
import { ApiError, sendData, sendError } from '../../lib/http.js'
import { getLaunchReadinessPublicSnapshot } from './launchReadiness.service.js'

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
  const snapshot = await getLaunchReadinessPublicSnapshot()
  sendData(request, response, snapshot)
})
