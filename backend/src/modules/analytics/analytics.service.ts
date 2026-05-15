import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { productEventCounter } from '../../config/metrics.js'
import { getDatabasePool } from '../../config/database.js'

type ProductEvent = {
  eventName: string
  householdId?: string | null
  userId?: string | null
  sessionId?: string | null
  properties?: Record<string, unknown>
}

type AnalyticsEventRow = QueryResultRow & {
  event_name: string
  event_count: string | number
}

const inMemoryEvents: Array<
  ProductEvent & {
    createdAt: string
  }
> = []

const keyLaunchEvents = [
  'auth.request_otp.success',
  'auth.verify_otp.success',
  'auth.verify_otp.failure',
  'auth.request_email_otp.success',
  'auth.verify_email_otp.success',
  'auth.verify_email_otp.failure',
  'auth.google_sign_in.success',
  'onboarding.household_created',
  'bank_link.start',
  'bank_link.success',
  'bank_link.failure',
  'manual_recurring.create',
  'recurring_candidate.confirm',
  'recurring_candidate.dismiss',
  'dashboard.activation',
  'notification.read',
  'notification.dismiss',
  'notification.snooze',
  'recommendation.action.accept',
  'recommendation.action.dismiss',
  'recommendation.action.snooze',
] as const

export async function recordProductEvent(event: ProductEvent) {
  const createdAt = new Date().toISOString()
  productEventCounter.inc({
    event_name: event.eventName,
  })

  const pool = getDatabasePool()

  if (!pool) {
    inMemoryEvents.unshift({
      ...event,
      createdAt,
    })
    return
  }

  await pool.query(
    `
      insert into analytics_events (
        id,
        event_name,
        household_id,
        user_id,
        session_id,
        properties,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7)
    `,
    [
      `evt_${randomUUID()}`,
      event.eventName,
      event.householdId ?? null,
      event.userId ?? null,
      event.sessionId ?? null,
      JSON.stringify(event.properties ?? {}),
      createdAt,
    ],
  )
}

export async function getLaunchReadinessAnalyticsSummary() {
  const pool = getDatabasePool()

  if (!pool) {
    const counts: Record<string, number> = Object.fromEntries(
      keyLaunchEvents.map((eventName) => [eventName, 0]),
    )

    for (const event of inMemoryEvents) {
      if (event.eventName in counts) {
        counts[event.eventName] = (counts[event.eventName] ?? 0) + 1
      }
    }

    return counts
  }

  const result = await pool.query<AnalyticsEventRow>(
    `
      select event_name, count(*) as event_count
      from analytics_events
      where event_name = any($1::varchar[])
      group by event_name
    `,
    [keyLaunchEvents],
  )

  const counts: Record<string, number> = Object.fromEntries(
    keyLaunchEvents.map((eventName) => [eventName, 0]),
  )

  for (const row of result.rows) {
    counts[row.event_name] = toNumber(row.event_count)
  }

  return counts
}

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value)
}
