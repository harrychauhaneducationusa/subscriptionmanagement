import { getDatabasePool } from '../../config/database.js'
import { logger } from '../../config/logger.js'

export type LinkSyncTier = 'free' | 'premium'

function isUndefinedTableError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '42P01'
}

/** Baseline pull interval before adaptive tuning (Phase 1.2). */
export function intervalSecondsForTier(tier: LinkSyncTier): number {
  return tier === 'premium' ? 6 * 60 * 60 : 24 * 60 * 60
}

/**
 * Computes the next scheduled run instant (ms since epoch).
 * Pass `jitterMs` in tests for determinism; production omits it for random jitter.
 */
export function computeNextRunAtMs(
  nowMs: number,
  tier: LinkSyncTier,
  jitterMaxSeconds = 300,
  jitterMs?: number,
): number {
  const intervalMs = intervalSecondsForTier(tier) * 1000
  const jitter =
    jitterMs !== undefined
      ? jitterMs
      : Math.floor(Math.random() * Math.max(0, jitterMaxSeconds) * 1000)
  return nowMs + intervalMs + jitter
}

/**
 * After a successful transaction ingest for a link, upsert schedule and push out `next_run_at`.
 * No-op without a database pool (local in-memory mode).
 */
export async function scheduleNextRunAfterIngestSuccess(linkId: string, at = new Date()): Promise<void> {
  const pool = getDatabasePool()

  if (!pool) {
    return
  }

  try {
    const tierResult = await pool.query<{ sync_tier: string }>(
      `
      select sync_tier
      from link_sync_schedule
      where link_id = $1
      limit 1
    `,
      [linkId],
    )

    const tier: LinkSyncTier = tierResult.rows[0]?.sync_tier === 'premium' ? 'premium' : 'free'
    const intervalSeconds = intervalSecondsForTier(tier)
    const nextMs = computeNextRunAtMs(at.getTime(), tier)
    const nextRunAt = new Date(nextMs).toISOString()

    await pool.query(
      `
      insert into link_sync_schedule (
        link_id,
        sync_tier,
        interval_seconds_effective,
        jitter_seconds_max,
        next_run_at,
        created_at,
        updated_at
      )
      values ($1, $2, $3, 300, $4::timestamptz, current_timestamp, current_timestamp)
      on conflict (link_id) do update set
        interval_seconds_effective = excluded.interval_seconds_effective,
        next_run_at = excluded.next_run_at,
        updated_at = current_timestamp
    `,
      [linkId, tier, intervalSeconds, nextRunAt],
    )
  } catch (error) {
    if (isUndefinedTableError(error)) {
      logger.warn(
        { linkId },
        'link_sync_schedule is missing; skipping schedule bump until migrations are applied',
      )
      return
    }
    throw error
  }
}
