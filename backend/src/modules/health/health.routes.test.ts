import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkDatabaseHealth = vi.hoisted(() => vi.fn())
const checkRedisHealth = vi.hoisted(() => vi.fn())
const getLaunchReadinessPublicSnapshot = vi.hoisted(() => vi.fn())
const metrics = vi.hoisted(() => vi.fn())

vi.mock('../../config/database.js', () => ({
  checkDatabaseHealth,
  getDatabasePool: vi.fn(),
}))
vi.mock('../../config/redis.js', () => ({
  checkRedisHealth,
  getRedisConnection: vi.fn(),
}))
vi.mock('../../config/metrics.js', () => ({
  metricsRegistry: {
    contentType: 'text/plain; version=0.0.4',
    metrics,
  },
}))
vi.mock('./launchReadiness.service.js', () => ({
  getLaunchReadinessPublicSnapshot,
}))

import express from 'express'
import request from 'supertest'
import { healthRouter } from './health.routes.js'

function buildApp() {
  const app = express()
  app.use('/v1', healthRouter)
  return app
}

describe('healthRouter', () => {
  beforeEach(() => {
    checkDatabaseHealth.mockReset()
    checkRedisHealth.mockReset()
    getLaunchReadinessPublicSnapshot.mockReset()
    metrics.mockReset()
  })

  it('GET /v1/health/live', async () => {
    const res = await request(buildApp()).get('/v1/health/live').expect(200)
    expect(res.body.data.status).toBe('live')
  })

  it('GET /v1/health includes service statuses', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'not_configured' })
    checkRedisHealth.mockResolvedValue({ status: 'available' })

    const res = await request(buildApp()).get('/v1/health').expect(200)
    expect(res.body.data.services.database).toBe('not_configured')
    expect(res.body.data.services.redis).toBe('available')
  })

  it('GET /v1/health/ready 200 when deps ok or not_configured', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'not_configured' })
    checkRedisHealth.mockResolvedValue({ status: 'not_configured' })

    const res = await request(buildApp()).get('/v1/health/ready').expect(200)
    expect(res.body.data.status).toBe('ready')
  })

  it('GET /v1/health/ready 503 when database unavailable', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'unavailable' })
    checkRedisHealth.mockResolvedValue({ status: 'not_configured' })

    await request(buildApp()).get('/v1/health/ready').expect(503)
  })

  it('GET /v1/metrics returns prometheus body', async () => {
    metrics.mockResolvedValue('# subsense')

    const res = await request(buildApp()).get('/v1/metrics').expect(200)
    expect(res.text).toContain('subsense')
  })

  it('GET /v1/health/launch-readiness', async () => {
    getLaunchReadinessPublicSnapshot.mockResolvedValue({
      status: 'healthy',
      services: { database: 'not_configured', redis: 'not_configured' },
      queues: {},
    })

    const res = await request(buildApp()).get('/v1/health/launch-readiness').expect(200)
    expect(res.body.data.status).toBe('healthy')
  })
})
