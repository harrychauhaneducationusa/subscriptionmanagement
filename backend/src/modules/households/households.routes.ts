import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import { setDefaultHouseholdForUserAndSession } from '../auth/auth.store.js'
import { createHousehold, getHousehold, getHouseholdMembership } from './households.store.js'

const createHouseholdSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['individual', 'couple', 'family', 'shared_household']),
  privacyMode: z.enum(['balanced', 'private_first']).optional(),
})

const selectHouseholdSchema = z.object({
  householdId: z.string().min(1),
})

export const householdsRouter = Router()
householdsRouter.use(requireSession)

householdsRouter.post('/', async (request, response) => {
  const payload = createHouseholdSchema.parse(request.body)
  const session = request.authSession

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const household = await createHousehold({
    ...payload,
    ownerUserId: session.userId,
  })

  await setDefaultHouseholdForUserAndSession({
    userId: session.userId,
    sessionId: session.sessionId,
    householdId: household.id,
  })

  await recordAuditEvent({
    id: `aud_${household.id}`,
    action: 'household.create',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'household',
    entityId: household.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'onboarding.household_created',
    householdId: household.id,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      householdType: household.type,
    },
  })

  sendData(request, response, {
    household,
    visibility: {
      ownership_scope: 'shared',
      viewer_access: 'full',
    },
  }, 201)
})

householdsRouter.get('/current', async (request, response) => {
  const session = request.authSession

  if (!session?.defaultHouseholdId) {
    throw new ApiError(404, 'HOUSEHOLD_NOT_FOUND', 'No active household has been selected yet')
  }

  const household = await getHousehold(session.defaultHouseholdId)

  if (!household) {
    throw new ApiError(404, 'HOUSEHOLD_NOT_FOUND', 'The active household could not be found')
  }

  const membership = await getHouseholdMembership(household.id, session.userId)

  if (!membership) {
    throw new ApiError(403, 'HOUSEHOLD_ACCESS_DENIED', 'You do not have access to this household')
  }

  sendData(request, response, {
    household,
    role: membership.role,
    viewer_access: membership.visibilityScope,
  })
})

householdsRouter.post('/current/select', async (request, response) => {
  const payload = selectHouseholdSchema.parse(request.body)
  const session = request.authSession

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const household = await getHousehold(payload.householdId)

  if (!household) {
    throw new ApiError(404, 'HOUSEHOLD_NOT_FOUND', 'The selected household could not be found')
  }

  const membership = await getHouseholdMembership(household.id, session.userId)

  if (!membership) {
    throw new ApiError(403, 'HOUSEHOLD_ACCESS_DENIED', 'You do not have access to this household')
  }

  await setDefaultHouseholdForUserAndSession({
    userId: session.userId,
    sessionId: session.sessionId,
    householdId: household.id,
  })

  sendData(request, response, {
    household,
  })
})
