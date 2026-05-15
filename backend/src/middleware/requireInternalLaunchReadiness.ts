import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { ApiError } from '../lib/http.js'

/**
 * Protects aggregate funnel analytics and notification ops data.
 * - When `INTERNAL_OPS_TOKEN` is set: requires matching `x-internal-ops-token` header.
 * - When unset: allowed only outside production (local dogfood); production without a token returns 403.
 */
export function requireInternalLaunchReadinessAccess(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const configured = env.INTERNAL_OPS_TOKEN

  if (configured) {
    const token = configured
    const headerRaw = request.headers['x-internal-ops-token']
    const header =
      typeof headerRaw === 'string'
        ? headerRaw
        : Array.isArray(headerRaw)
          ? (headerRaw[0] ?? '')
          : ''
    const a = Buffer.from(header, 'utf8')
    const b = Buffer.from(token, 'utf8')

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      next(
        new ApiError(
          403,
          'INTERNAL_OPS_FORBIDDEN',
          'A valid x-internal-ops-token header is required for this resource',
        ),
      )
      return
    }

    next()
    return
  }

  if (env.NODE_ENV === 'production') {
    next(
      new ApiError(
        403,
        'INTERNAL_OPS_DISABLED',
        'INTERNAL_OPS_TOKEN must be configured in production to access launch readiness details',
      ),
    )
    return
  }

  next()
}
