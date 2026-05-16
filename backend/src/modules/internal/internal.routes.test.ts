import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../middleware/requireSession.js', () => ({
  requireSession: (req: import('express').Request, _res: unknown, next: import('express').NextFunction) => {
    ;(req as { authSession?: unknown }).authSession = {
      sessionId: 'ses_t',
      userId: 'usr_t',
      phoneNumberMasked: '******0000',
      authState: 'verified',
      defaultHouseholdId: null,
      lifecycleStatus: 'active',
      createdAt: new Date().toISOString(),
    }
    next()
  },
}))

vi.mock('../../middleware/requireInternalLaunchReadiness.js', () => ({
  requireInternalLaunchReadinessAccess: (_req: unknown, _res: unknown, next: import('express').NextFunction) =>
    next(),
}))

const getLaunchReadinessReport = vi.hoisted(() => vi.fn())

vi.mock('../health/launchReadiness.service.js', () => ({
  getLaunchReadinessReport,
}))

import express from 'express'
import request from 'supertest'
import { internalRouter } from './internal.routes.js'

describe('internalRouter', () => {
  beforeEach(() => {
    getLaunchReadinessReport.mockReset()
  })

  it('GET /launch-readiness returns report', async () => {
    getLaunchReadinessReport.mockResolvedValue({
      status: 'healthy',
      services: { database: 'not_configured', redis: 'not_configured' },
      analytics: {},
      notifications: { total: 0, unread: 0, byChannel: {} },
      queues: {},
    })

    const app = express()
    app.use(express.json())
    app.use('/v1/internal', internalRouter)

    const res = await request(app).get('/v1/internal/launch-readiness').expect(200)
    expect(res.body.data.status).toBe('healthy')
  })
})
