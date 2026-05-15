import { checkDatabaseHealth } from '../../config/database.js'
import { checkRedisHealth } from '../../config/redis.js'
import { getLaunchReadinessAnalyticsSummary } from '../analytics/analytics.service.js'
import { getNotificationOperationalSummary } from '../notifications/notifications.store.js'
import { queues } from '../../queues/registry.js'

export type LaunchReadinessReport = {
  status: 'healthy' | 'degraded'
  services: {
    database: string
    redis: string
  }
  analytics: Record<string, number>
  notifications: {
    total: number
    unread: number
    byChannel: Record<string, Record<string, number>>
  }
  queues: Record<string, Record<string, number> | null>
}

export async function getLaunchReadinessReport(): Promise<LaunchReadinessReport> {
  const [database, redis, analytics, notifications, queueSnapshot] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    getLaunchReadinessAnalyticsSummary(),
    getNotificationOperationalSummary(),
    getQueueSnapshot(),
  ])

  return {
    status: database.status === 'available' && redis.status === 'available' ? 'healthy' : 'degraded',
    services: {
      database: database.status,
      redis: redis.status,
    },
    analytics,
    notifications,
    queues: queueSnapshot,
  }
}

export type LaunchReadinessPublicSnapshot = Pick<LaunchReadinessReport, 'status' | 'services' | 'queues'>

export async function getLaunchReadinessPublicSnapshot(): Promise<LaunchReadinessPublicSnapshot> {
  const full = await getLaunchReadinessReport()
  return {
    status: full.status,
    services: full.services,
    queues: full.queues,
  }
}

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
