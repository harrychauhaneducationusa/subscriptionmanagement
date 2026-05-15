import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { listInstitutionLinks } from '../aggregation/aggregation.store.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import {
  refreshNotificationsForUser,
  syncNotificationCenterFromData,
} from '../notifications/notifications.service.js'
import {
  applyRecommendationAction,
  getDashboardInsightData,
  listHouseholdInsightFeed,
  listHouseholdRecommendations,
} from './insights.store.js'

export const insightsRouter = Router()
insightsRouter.use(requireSession)

const recommendationActionSchema = z.object({
  action: z.enum(['accept', 'dismiss', 'snooze']),
  snoozeDays: z.coerce.number().int().positive().max(90).optional(),
})

insightsRouter.get('/dashboard-summary', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId
  const session = request.authSession

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before dashboard insights can be shown',
    )
  }

  const [data, links] = await Promise.all([
    getDashboardInsightData(householdId),
    listInstitutionLinks(householdId),
  ])

  if (session) {
    await recordProductEvent({
      eventName: 'dashboard.activation',
      householdId,
      userId: session.userId,
      sessionId: session.sessionId,
      properties: {
        openRecommendationCount: data.summary.openRecommendationCount,
        pendingCandidateCount: data.summary.pendingCandidateCount,
      },
    })

    await syncNotificationCenterFromData({
      householdId,
      userId: session.userId,
      recommendations: data.recommendations,
      upcomingRenewals: data.summary.upcomingRenewals,
      links,
    })
  }

  sendData(request, response, {
    summary: data.summary,
    recommendations: data.recommendations,
    freshness: data.freshness,
  })
})

insightsRouter.get('/recommendations', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before recommendations can be shown',
    )
  }

  const recommendations = await listHouseholdRecommendations(householdId)

  sendData(request, response, {
    items: recommendations,
    empty_state: recommendations.length === 0 ? 'no_recommendations' : null,
  })
})

insightsRouter.post('/recommendations/:id/action', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId
  const session = request.authSession

  if (!householdId || !session) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before a recommendation can be updated',
    )
  }

  const payload = recommendationActionSchema.parse(request.body)
  const recommendation = await applyRecommendationAction(householdId, request.params.id, {
    action: payload.action,
    actorId: session.userId,
    snoozeDays: payload.snoozeDays,
  })

  if (!recommendation) {
    throw new ApiError(404, 'RECOMMENDATION_NOT_FOUND', 'The recommendation could not be found')
  }

  await recordAuditEvent({
    id: `aud_rec_${Date.now()}`,
    action: `insights.recommendation.${payload.action}`,
    actorType: 'user',
    actorId: session.userId,
    entityType: 'recommendation',
    entityId: recommendation.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: `recommendation.action.${payload.action}`,
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      recommendationId: recommendation.id,
      recommendationType: recommendation.recommendationType,
    },
  })

  await refreshNotificationsForUser(householdId, session.userId)

  sendData(request, response, {
    recommendation,
  })
})

insightsRouter.get('/feed', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before the insight feed can be shown',
    )
  }

  const events = await listHouseholdInsightFeed(householdId)

  sendData(request, response, {
    items: events,
    empty_state: events.length === 0 ? 'no_insight_events' : null,
  })
})
