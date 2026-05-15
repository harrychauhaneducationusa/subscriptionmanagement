import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { passport } from './config/passport.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { analyticsRouter } from './modules/analytics/analytics.routes.js'
import { aggregationRouter } from './modules/aggregation/aggregation.routes.js'
import {
  assignRequestContext,
  recordRequestMetrics,
  requestLogger,
} from './middleware/requestContext.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { healthRouter } from './modules/health/health.routes.js'
import { householdsRouter } from './modules/households/households.routes.js'
import { insightsRouter } from './modules/insights/insights.routes.js'
import {
  notificationPreferencesRouter,
  notificationsRouter,
} from './modules/notifications/notifications.routes.js'
import { onboardingRouter } from './modules/onboarding/onboarding.routes.js'
import { recurringRouter } from './modules/recurring/recurring.routes.js'
import { transactionsRouter } from './modules/transactions/transactions.routes.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  )
  app.use(helmet())
  app.use(express.json())
  app.use(passport.initialize())
  app.use(assignRequestContext)
  app.use(requestLogger)
  app.use(recordRequestMetrics)

  app.use('/v1', healthRouter)
  app.use('/v1/aggregation', aggregationRouter)
  app.use('/v1/auth', authRouter)
  app.use('/v1/households', householdsRouter)
  app.use('/v1/onboarding', onboardingRouter)
  app.use('/v1/recurring', recurringRouter)
  app.use('/v1/analytics', analyticsRouter)
  app.use('/v1/insights', insightsRouter)
  app.use('/v1/notifications', notificationsRouter)
  app.use('/v1/notification-preferences', notificationPreferencesRouter)
  app.use('/v1/transactions', transactionsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
