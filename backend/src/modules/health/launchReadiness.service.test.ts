import { describe, expect, it, vi } from 'vitest'

const checkDatabaseHealth = vi.hoisted(() => vi.fn())
const checkRedisHealth = vi.hoisted(() => vi.fn())
const getLaunchReadinessAnalyticsSummary = vi.hoisted(() => vi.fn())
const getNotificationOperationalSummary = vi.hoisted(() => vi.fn())

vi.mock('../../config/database.js', () => ({
  checkDatabaseHealth,
}))
vi.mock('../../config/redis.js', () => ({
  checkRedisHealth,
}))
vi.mock('../analytics/analytics.service.js', () => ({
  getLaunchReadinessAnalyticsSummary,
}))
vi.mock('../notifications/notifications.store.js', () => ({
  getNotificationOperationalSummary,
}))

const queueGetJobCounts = vi.hoisted(() => vi.fn().mockResolvedValue({ waiting: 0, active: 0 }))

vi.mock('../../queues/registry.js', () => ({
  queues: {
    aggregationLifecycle: { getJobCounts: queueGetJobCounts },
    transactionIngestion: null,
    transactionNormalization: null,
    recurringDetection: null,
    notificationDispatch: null,
  },
}))

import { getLaunchReadinessPublicSnapshot, getLaunchReadinessReport } from './launchReadiness.service.js'

describe('launchReadiness.service', () => {
  it('getLaunchReadinessReport aggregates services and queue snapshot', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'available' })
    checkRedisHealth.mockResolvedValue({ status: 'available' })
    getLaunchReadinessAnalyticsSummary.mockResolvedValue({ bank_link_start: 1 })
    getNotificationOperationalSummary.mockResolvedValue({
      total: 0,
      unread: 0,
      byChannel: {},
    })

    const report = await getLaunchReadinessReport()

    expect(report.status).toBe('healthy')
    expect(report.services.database).toBe('available')
    expect(report.analytics.bank_link_start).toBe(1)
    expect(report.queues.aggregationLifecycle).toEqual(
      expect.objectContaining({ waiting: 0, active: 0 }),
    )
  })

  it('getLaunchReadinessPublicSnapshot omits analytics and notifications', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'available' })
    checkRedisHealth.mockResolvedValue({ status: 'not_configured' })
    getLaunchReadinessAnalyticsSummary.mockResolvedValue({})
    getNotificationOperationalSummary.mockResolvedValue({
      total: 1,
      unread: 0,
      byChannel: {},
    })

    const snap = await getLaunchReadinessPublicSnapshot()

    expect(snap).not.toHaveProperty('analytics')
    expect(snap.services.redis).toBe('not_configured')
  })

  it('status degraded when redis not available', async () => {
    checkDatabaseHealth.mockResolvedValue({ status: 'available' })
    checkRedisHealth.mockResolvedValue({ status: 'unavailable' })
    getLaunchReadinessAnalyticsSummary.mockResolvedValue({})
    getNotificationOperationalSummary.mockResolvedValue({
      total: 0,
      unread: 0,
      byChannel: {},
    })

    const report = await getLaunchReadinessReport()
    expect(report.status).toBe('degraded')
  })
})
