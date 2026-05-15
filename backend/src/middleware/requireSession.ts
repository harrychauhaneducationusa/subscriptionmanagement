import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../lib/http.js'
import { getSession } from '../modules/auth/auth.store.js'

export async function requireSession(request: Request, _response: Response, next: NextFunction) {
  const sessionId = request.headers.authorization?.replace('Bearer ', '')

  if (!sessionId) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'A session token is required'))
    return
  }

  const session = await getSession(sessionId)

  if (!session) {
    next(new ApiError(401, 'SESSION_INVALID', 'The session token is invalid or expired'))
    return
  }

  request.authSession = session
  next()
}
