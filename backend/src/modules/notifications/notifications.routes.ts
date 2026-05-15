import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { refreshNotificationsForUser } from './notifications.service.js'
import {
  dismissNotification,
  getNotificationPreferences,
  getUnreadInAppNotificationCount,
  listNotificationsForUser,
  markNotificationRead,
  snoozeNotification,
  updateNotificationPreferences,
} from './notifications.store.js'

const notificationPreferenceSchema = z.object({
  inAppRecommendationEnabled: z.boolean().optional(),
  inAppRenewalEnabled: z.boolean().optional(),
  inAppStaleLinkEnabled: z.boolean().optional(),
  emailRecommendationEnabled: z.boolean().optional(),
  emailRenewalEnabled: z.boolean().optional(),
  emailStaleLinkEnabled: z.boolean().optional(),
})

const snoozeSchema = z.object({
  snoozeDays: z.coerce.number().int().positive().max(90).default(7),
})

export const notificationsRouter = Router()
notificationsRouter.use(requireSession)

notificationsRouter.get('/unread-summary', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before notification counts can be loaded',
    )
  }

  const summary = await getUnreadInAppNotificationCount(householdId, session.userId)
  sendData(request, response, summary)
})

notificationsRouter.get('/', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before notifications can be loaded',
    )
  }

  await refreshNotificationsForUser(householdId, session.userId)

  const notifications = await listNotificationsForUser(householdId, session.userId)

  sendData(request, response, notifications)
})

notificationsRouter.post('/:id/read', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before notifications can be updated',
    )
  }

  const notification = await markNotificationRead(householdId, session.userId, request.params.id)

  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification could not be found')
  }

  await recordAuditEvent({
    id: `aud_ntf_${Date.now()}`,
    action: 'notification.read',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'notification',
    entityId: notification.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'notification.read',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      notificationType: notification.notificationType,
    },
  })

  sendData(request, response, { notification })
})

notificationsRouter.post('/:id/dismiss', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before notifications can be updated',
    )
  }

  const notification = await dismissNotification(householdId, session.userId, request.params.id)

  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification could not be found')
  }

  await recordAuditEvent({
    id: `aud_ntf_${Date.now()}`,
    action: 'notification.dismiss',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'notification',
    entityId: notification.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'notification.dismiss',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      notificationType: notification.notificationType,
    },
  })

  sendData(request, response, { notification })
})

notificationsRouter.post('/:id/snooze', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before notifications can be updated',
    )
  }

  const payload = snoozeSchema.parse(request.body ?? {})
  const notification = await snoozeNotification(
    householdId,
    session.userId,
    request.params.id,
    payload.snoozeDays,
  )

  if (!notification) {
    throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification could not be found')
  }

  await recordAuditEvent({
    id: `aud_ntf_${Date.now()}`,
    action: 'notification.snooze',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'notification',
    entityId: notification.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'notification.snooze',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      notificationType: notification.notificationType,
      snoozeDays: payload.snoozeDays,
    },
  })

  sendData(request, response, { notification })
})

export const notificationPreferencesRouter = Router()
notificationPreferencesRouter.use(requireSession)

notificationPreferencesRouter.get('/', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before preferences can be loaded',
    )
  }

  const preferences = await getNotificationPreferences(householdId, session.userId)
  sendData(request, response, { preferences })
})

notificationPreferencesRouter.patch('/', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before preferences can be updated',
    )
  }

  const payload = notificationPreferenceSchema.parse(request.body)
  const preferences = await updateNotificationPreferences(householdId, session.userId, payload)
  await refreshNotificationsForUser(householdId, session.userId)

  await recordAuditEvent({
    id: `aud_pref_${Date.now()}`,
    action: 'notification.preferences.update',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'notification_preferences',
    entityId: preferences.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, { preferences })
})
