import { Pool } from 'pg'
import { env } from './env.js'
import { logger } from './logger.js'

let pool: Pool | null = null

export function getDatabasePool() {
  if (!env.DATABASE_URL) {
    return null
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
    })

    pool.on('error', (error: Error) => {
      logger.error({ error }, 'Unexpected PostgreSQL pool error')
    })
  }

  return pool
}

export async function checkDatabaseHealth() {
  const databasePool = getDatabasePool()

  if (!databasePool) {
    return { status: 'not_configured' as const }
  }

  try {
    await databasePool.query('select 1')
    return { status: 'available' as const }
  } catch (error) {
    logger.warn({ error }, 'Database health check failed')
    return { status: 'unavailable' as const }
  }
}
