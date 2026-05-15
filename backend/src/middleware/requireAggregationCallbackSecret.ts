import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { ApiError } from '../lib/http.js'

function timingSafeEqualString(expected: string, received: string): boolean {
  const left = createHash('sha256').update(expected, 'utf8').digest()
  const right = createHash('sha256').update(received, 'utf8').digest()
  return left.length === right.length && timingSafeEqual(left, right)
}

function extractCallbackSecret(request: Request): string | null {
  const headerSecret = request.headers['x-subsense-callback-secret']
  if (typeof headerSecret === 'string' && headerSecret.length > 0) {
    return headerSecret
  }

  const auth = request.headers.authorization
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }

  return null
}

/**
 * When `AGGREGATION_CALLBACK_SECRET` is set, callbacks must send the same value via
 * `X-Subsense-Callback-Secret` or `Authorization: Bearer <secret>`.
 * In production, the secret must be configured for public callback routes.
 */
export function requireAggregationCallbackSecret(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const configured = Boolean(env.AGGREGATION_CALLBACK_SECRET)

  if (!configured) {
    if (env.NODE_ENV === 'production') {
      next(
        new ApiError(
          503,
          'CALLBACK_SECRET_NOT_CONFIGURED',
          'Aggregation callback secret is not configured',
        ),
      )
      return
    }

    next()
    return
  }

  const provided = extractCallbackSecret(request)

  if (!provided) {
    next(
      new ApiError(
        401,
        'CALLBACK_AUTH_REQUIRED',
        'A valid callback credential is required',
      ),
    )
    return
  }

  if (!timingSafeEqualString(env.AGGREGATION_CALLBACK_SECRET!, provided)) {
    next(new ApiError(401, 'CALLBACK_AUTH_INVALID', 'Callback credential is invalid'))
    return
  }

  next()
}
