import { Redis } from 'ioredis'
import { env } from './env.js'
import { logger } from './logger.js'

let redis: Redis | null = null

export function getRedisConnection() {
  if (!env.REDIS_URL) {
    return null
  }

  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

    redis.on('error', (error: Error) => {
      logger.warn({ error }, 'Redis connection error')
    })
  }

  return redis
}

export async function checkRedisHealth() {
  const connection = getRedisConnection()

  if (!connection) {
    return { status: 'not_configured' as const }
  }

  try {
    await connection.ping()
    return { status: 'available' as const }
  } catch (error) {
    logger.warn({ error }, 'Redis health check failed')
    return { status: 'unavailable' as const }
  }
}
