import { getDatabasePool } from '../../config/database.js'

type AuditEvent = {
  id: string
  action: string
  actorType: 'user' | 'system'
  actorId?: string
  entityType: string
  entityId: string
  createdAt: string
  metadata?: Record<string, unknown>
}

const auditEvents: AuditEvent[] = []

export async function recordAuditEvent(event: AuditEvent) {
  const pool = getDatabasePool()

  if (!pool) {
    auditEvents.unshift(event)
    return
  }

  await pool.query(
    `
      insert into audit_events (
        id,
        action,
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        metadata,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
    `,
    [
      event.id,
      event.action,
      event.actorType,
      event.actorId ?? null,
      event.entityType,
      event.entityId,
      JSON.stringify(event.metadata ?? {}),
      event.createdAt,
    ],
  )
}

export function listRecentAuditEvents(limit = 20) {
  return auditEvents.slice(0, limit)
}
