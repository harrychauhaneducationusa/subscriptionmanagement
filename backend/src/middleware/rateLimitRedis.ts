import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { getRedisConnection } from '../config/redis.js'
import { ApiError } from '../lib/http.js'

let warnedMissingRedisForRateLimit = false

export function clientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim()
  }

  return request.socket.remoteAddress ?? 'unknown'
}

/**
 * Fixed-window per-IP limiter using Redis INCR. Without Redis, skips limiting in
 * non-production and logs once in production (configure Redis for real limits).
 */
export function rateLimitRedis(options: {
  windowSeconds: number
  max: number
  keyPrefix: string
}) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    const redis = getRedisConnection()

    if (!redis) {
      if (env.NODE_ENV === 'production' && !warnedMissingRedisForRateLimit) {
        warnedMissingRedisForRateLimit = true
        logger.warn(
          { keyPrefix: options.keyPrefix },
          'Redis is not configured; per-IP rate limits are disabled',
        )
      }

      next()
      return
    }

    const bucket = Math.floor(Date.now() / (options.windowSeconds * 1000))
    const ip = clientIp(request)
    const key = `ratelimit:${options.keyPrefix}:${ip}:${bucket}`

    try {
      const count = await redis.incr(key)

      if (count === 1) {
        await redis.expire(key, options.windowSeconds + 5)
      }

      if (count > options.max) {
        next(
          new ApiError(429, 'RATE_LIMITED', 'Too many requests', {
            retryAfterSeconds: options.windowSeconds,
          }),
        )
        return
      }
    } catch (error) {
      logger.warn({ error, keyPrefix: options.keyPrefix }, 'Redis rate limit check failed')
      next()
      return
    }

    next()
  }
}
