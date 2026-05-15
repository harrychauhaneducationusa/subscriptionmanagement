import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { isClientIngestibleProductEvent, recordProductEvent } from './analytics.service.js'

const ingestEventSchema = z.object({
  eventName: z.string().min(1).max(128),
  properties: z.record(z.string(), z.unknown()).optional(),
})

export const analyticsRouter = Router()
analyticsRouter.use(requireSession)

analyticsRouter.post('/events', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session is required to record analytics events')
  }

  const payload = ingestEventSchema.parse(request.body ?? {})

  if (!isClientIngestibleProductEvent(payload.eventName)) {
    throw new ApiError(
      400,
      'ANALYTICS_EVENT_NOT_ALLOWED',
      'This event cannot be recorded from the client',
    )
  }

  await recordProductEvent({
    eventName: payload.eventName,
    householdId: householdId ?? null,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: payload.properties ?? {},
  })

  sendData(request, response, { recorded: true })
})
