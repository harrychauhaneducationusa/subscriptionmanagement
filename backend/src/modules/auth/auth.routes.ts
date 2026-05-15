import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { env, isGoogleOAuthEnabled } from '../../config/env.js'
import { passport } from '../../config/passport.js'
import type { GoogleAuthUser } from '../../config/passport.js'
import { getDatabasePool } from '../../config/database.js'
import { rateLimitRedis } from '../../middleware/rateLimitRedis.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import { createEmailOtpChallenge, consumeEmailOtpIfValid } from './emailOtp.store.js'
import {
  createOtpRequest,
  createSession,
  findOrCreateVerifiedUser,
  findOrCreateVerifiedUserFromEmail,
  getOtpRequest,
  getSession,
  getAppUserById,
} from './auth.store.js'

const requestOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(20),
})

const verifyOtpSchema = z.object({
  requestId: z.string().min(1),
  otp: z.string().min(4),
  defaultHouseholdId: z.string().min(1).nullable().optional(),
})

const requestEmailOtpSchema = z.object({
  email: z.string().email(),
})

const verifyEmailOtpSchema = z.object({
  requestId: z.string().min(1),
  email: z.string().email(),
  otp: z.string().min(4).max(12),
  defaultHouseholdId: z.string().min(1).nullable().optional(),
})

export const authRouter = Router()

const requestOtpLimiter = rateLimitRedis({
  windowSeconds: 60,
  max: 10,
  keyPrefix: 'auth-request-otp',
})

const verifyOtpLimiter = rateLimitRedis({
  windowSeconds: 60,
  max: 40,
  keyPrefix: 'auth-verify-otp',
})

const sessionReadLimiter = rateLimitRedis({
  windowSeconds: 60,
  max: 120,
  keyPrefix: 'auth-session-read',
})

const requestEmailOtpLimiter = rateLimitRedis({
  windowSeconds: 3600,
  max: 10,
  keyPrefix: 'auth-request-email-otp',
})

const verifyEmailOtpLimiter = rateLimitRedis({
  windowSeconds: 3600,
  max: 40,
  keyPrefix: 'auth-verify-email-otp',
})

function requireDatabase() {
  return (_request: Request, _response: Response, next: NextFunction) => {
    if (!getDatabasePool()) {
      next(
        new ApiError(
          503,
          'DATABASE_REQUIRED',
          'Email and Google sign-in require DATABASE_URL to be configured',
        ),
      )
      return
    }

    next()
  }
}

authRouter.post('/request-otp', requestOtpLimiter, async (request, response) => {
  const payload = requestOtpSchema.parse(request.body)
  const otpRequest = await createOtpRequest(payload.phoneNumber)

  await recordProductEvent({
    eventName: 'auth.request_otp.success',
    properties: {
      phoneNumberPrefix: payload.phoneNumber.slice(0, 4),
    },
  })

  sendData(request, response, {
    requestId: otpRequest.requestId,
    cooldownSeconds: 30,
    retryLimit: 5,
    devOtpHint: env.NODE_ENV === 'development' ? env.OTP_TEST_CODE : undefined,
  })
})

authRouter.post('/verify-otp', verifyOtpLimiter, async (request, response) => {
  const payload = verifyOtpSchema.parse(request.body)
  const otpRequest = await getOtpRequest(payload.requestId)

  if (!otpRequest) {
    await recordProductEvent({
      eventName: 'auth.verify_otp.failure',
      properties: {
        reason: 'request_not_found',
      },
    })
    throw new ApiError(404, 'OTP_REQUEST_NOT_FOUND', 'The OTP request could not be found')
  }

  if (payload.otp !== env.OTP_TEST_CODE) {
    await recordProductEvent({
      eventName: 'auth.verify_otp.failure',
      properties: {
        reason: 'otp_invalid',
      },
    })
    throw new ApiError(401, 'OTP_INVALID', 'The OTP code is invalid')
  }

  const user = await findOrCreateVerifiedUser(otpRequest.phoneNumber)
  const session = await createSession({
    userId: user.id,
    phoneNumberMasked: user.phoneNumberMasked,
    defaultHouseholdId: payload.defaultHouseholdId ?? user.defaultHouseholdId,
  })

  await recordAuditEvent({
    id: `aud_${session.sessionId}`,
    action: 'auth.verify_otp',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'session',
    entityId: session.sessionId,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'auth.verify_otp.success',
    userId: session.userId,
    sessionId: session.sessionId,
    householdId: session.defaultHouseholdId,
  })

  sendData(request, response, {
    session,
    user,
  })
})

authRouter.post(
  '/request-email-otp',
  requireDatabase(),
  requestEmailOtpLimiter,
  async (request, response) => {
    if (!env.ENABLE_EMAIL_OTP) {
      throw new ApiError(404, 'NOT_FOUND', 'Email OTP is not enabled')
    }

    const payload = requestEmailOtpSchema.parse(request.body)
    const challenge = await createEmailOtpChallenge(payload.email)

    await recordProductEvent({
      eventName: 'auth.request_email_otp.success',
      properties: {
        emailDomain: payload.email.split('@')[1] ?? 'unknown',
        delivery: challenge.delivery,
      },
    })

    sendData(request, response, {
      requestId: challenge.requestId,
      cooldownSeconds: 60,
      devOtpHint: challenge.devOtpHint,
      delivery: challenge.delivery,
    })
  },
)

authRouter.post(
  '/verify-email-otp',
  requireDatabase(),
  verifyEmailOtpLimiter,
  async (request, response) => {
    if (!env.ENABLE_EMAIL_OTP) {
      throw new ApiError(404, 'NOT_FOUND', 'Email OTP is not enabled')
    }

    const payload = verifyEmailOtpSchema.parse(request.body)
    const verified = await consumeEmailOtpIfValid({
      requestId: payload.requestId,
      email: payload.email,
      code: payload.otp,
    })

    if (!verified.ok) {
      await recordProductEvent({
        eventName: 'auth.verify_email_otp.failure',
        properties: {
          reason: verified.reason,
        },
      })

      if (verified.reason === 'OTP_REQUEST_NOT_FOUND') {
        throw new ApiError(404, 'OTP_REQUEST_NOT_FOUND', 'The email OTP request could not be found')
      }

      if (verified.reason === 'OTP_EXPIRED') {
        throw new ApiError(410, 'OTP_EXPIRED', 'The verification code has expired')
      }

      throw new ApiError(401, 'OTP_INVALID', 'The verification code is invalid')
    }

    const user = await findOrCreateVerifiedUserFromEmail(verified.emailNormalized)
    const session = await createSession({
      userId: user.id,
      phoneNumberMasked: user.phoneNumberMasked,
      defaultHouseholdId: payload.defaultHouseholdId ?? user.defaultHouseholdId,
    })

    await recordAuditEvent({
      id: `aud_${session.sessionId}`,
      action: 'auth.verify_email_otp',
      actorType: 'user',
      actorId: session.userId,
      entityType: 'session',
      entityId: session.sessionId,
      createdAt: new Date().toISOString(),
    })

    await recordProductEvent({
      eventName: 'auth.verify_email_otp.success',
      userId: session.userId,
      sessionId: session.sessionId,
      householdId: session.defaultHouseholdId,
    })

    sendData(request, response, {
      session,
      user,
    })
  },
)

authRouter.get('/google', (request, response, next) => {
  if (!isGoogleOAuthEnabled()) {
    next(new ApiError(404, 'NOT_FOUND', 'Google sign-in is not enabled'))
    return
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(request, response, next)
})

authRouter.get(
  '/google/callback',
  (request, response, next) => {
    if (!isGoogleOAuthEnabled()) {
      next(new ApiError(404, 'NOT_FOUND', 'Google sign-in is not enabled'))
      return
    }

    next()
  },
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/auth/callback?error=google_auth_failed`,
  }),
  async (request, response) => {
    const profileUser = request.user as GoogleAuthUser
    const session = await createSession({
      userId: profileUser.userId,
      phoneNumberMasked: profileUser.sessionMask,
      defaultHouseholdId: profileUser.defaultHouseholdId,
    })

    await recordAuditEvent({
      id: `aud_${session.sessionId}`,
      action: 'auth.google_callback',
      actorType: 'user',
      actorId: session.userId,
      entityType: 'session',
      entityId: session.sessionId,
      createdAt: new Date().toISOString(),
    })

    await recordProductEvent({
      eventName: 'auth.google_sign_in.success',
      userId: session.userId,
      sessionId: session.sessionId,
      householdId: session.defaultHouseholdId,
    })

    response.redirect(
      `${env.FRONTEND_URL}/auth/callback?sessionId=${encodeURIComponent(session.sessionId)}`,
    )
  },
)

authRouter.get('/session', sessionReadLimiter, async (request, response) => {
  const sessionId = request.headers.authorization?.replace('Bearer ', '')

  if (!sessionId) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const session = await getSession(sessionId)

  if (!session) {
    throw new ApiError(401, 'SESSION_INVALID', 'The session token is invalid or expired')
  }

  const user = await getAppUserById(session.userId)

  sendData(request, response, {
    session,
    user,
  })
})
