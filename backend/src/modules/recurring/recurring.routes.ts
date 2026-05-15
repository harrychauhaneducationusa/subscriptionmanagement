import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import {
  confirmRecurringCandidate,
  dismissRecurringCandidate,
  listRecurringCandidates,
  mergeRecurringCandidate,
  updateRecurringCandidate,
} from './candidates.store.js'
import {
  createSubscription,
  createUtilityBill,
  listRecurringItems,
  updateSubscription,
  updateUtilityBill,
} from './recurring.store.js'

const subscriptionSchema = z.object({
  name: z.string().min(1),
  providerName: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  cadence: z.enum(['monthly', 'quarterly', 'yearly']),
  nextRenewalAt: z.string().datetime().nullable().optional(),
  ownershipScope: z.enum(['personal', 'shared']).default('personal'),
})

const recurringStatusSchema = z.enum(['active', 'paused', 'cancelled'])
const subscriptionUpdateSchema = subscriptionSchema.partial().extend({
  status: recurringStatusSchema.optional(),
})
const utilitySchema = z.object({
  providerName: z.string().min(1),
  category: z.string().min(1),
  typicalAmount: z.coerce.number().positive(),
  cadence: z.enum(['monthly', 'bi_monthly', 'quarterly']),
  nextDueAt: z.string().datetime().nullable().optional(),
  ownershipScope: z.enum(['personal', 'shared']).default('personal'),
})
const utilityUpdateSchema = utilitySchema.partial().extend({
  status: recurringStatusSchema.optional(),
})
const candidateFiltersSchema = z.object({
  review_status: z
    .enum(['pending_review', 'confirmed', 'dismissed', 'merged', 'expired'])
    .optional(),
  candidate_type: z.enum(['subscription', 'utility', 'other_recurring']).optional(),
  confidence_min: z.coerce.number().min(0).max(1).optional(),
  ownership_scope: z.enum(['personal', 'shared']).optional(),
})
const candidateUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  candidateType: z.enum(['subscription', 'utility', 'other_recurring']).optional(),
  category: z.string().min(1).optional(),
  suggestedAmount: z.coerce.number().positive().optional(),
  cadence: z.string().min(1).optional(),
  ownershipScope: z.enum(['personal', 'shared']).optional(),
  suggestedNextOccurrenceAt: z.string().datetime().nullable().optional(),
})
const candidateConfirmSchema = z.object({})
const candidateMergeSchema = z.object({
  targetRecurringId: z.string().min(1),
})

export const recurringRouter = Router()
recurringRouter.use(requireSession)

recurringRouter.get('/', async (request, response) => {
  const householdId = getHouseholdId(request)
  const items = await listRecurringItems(householdId)

  sendData(request, response, {
    items,
  })
})

recurringRouter.get('/candidates', async (request, response) => {
  const householdId = getHouseholdId(request)
  const filters = candidateFiltersSchema.parse(request.query)
  const candidates = await listRecurringCandidates(householdId, {
    reviewStatus: filters.review_status,
    candidateType: filters.candidate_type,
    confidenceMin: filters.confidence_min,
    ownershipScope: filters.ownership_scope,
  })

  sendData(request, response, {
    items: candidates,
  })
})

recurringRouter.patch('/candidates/:candidateId', async (request, response) => {
  const householdId = getHouseholdId(request)
  const payload = candidateUpdateSchema.parse(request.body)
  const session = request.authSession

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const candidate = await updateRecurringCandidate(householdId, request.params.candidateId, payload)

  if (!candidate) {
    throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'The recurring candidate could not be found')
  }

  await recordAuditEvent({
    id: `aud_${candidate.id}_${Date.now()}`,
    action: 'recurring.candidate.update',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'recurring_candidate',
    entityId: candidate.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'recurring_candidate.dismiss',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      candidateId: candidate.id,
      candidateType: candidate.candidateType,
    },
  })

  sendData(request, response, { candidate })
})

recurringRouter.post('/candidates/:candidateId/confirm', async (request, response) => {
  const householdId = getHouseholdId(request)
  candidateConfirmSchema.parse(request.body ?? {})
  const session = request.authSession

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const result = await confirmRecurringCandidate(householdId, request.params.candidateId, {
    createdBy: session.userId,
  })

  if (!result) {
    throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'The recurring candidate could not be found')
  }

  await recordAuditEvent({
    id: `aud_${result.candidate.id}_${Date.now()}`,
    action: 'recurring.candidate.confirm',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'recurring_candidate',
    entityId: result.candidate.id,
    createdAt: new Date().toISOString(),
  })

  await recordProductEvent({
    eventName: 'recurring_candidate.confirm',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      candidateId: result.candidate.id,
      candidateType: result.candidate.candidateType,
      recurringKind: result.recurringItem.kind,
    },
  })

  sendData(request, response, result)
})

recurringRouter.post('/candidates/:candidateId/dismiss', async (request, response) => {
  const householdId = getHouseholdId(request)
  const session = request.authSession

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const candidate = await dismissRecurringCandidate(householdId, request.params.candidateId)

  if (!candidate) {
    throw new ApiError(404, 'CANDIDATE_NOT_FOUND', 'The recurring candidate could not be found')
  }

  await recordAuditEvent({
    id: `aud_${candidate.id}_${Date.now()}`,
    action: 'recurring.candidate.dismiss',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'recurring_candidate',
    entityId: candidate.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, { candidate })
})

recurringRouter.post('/candidates/:candidateId/merge', async (request, response) => {
  const householdId = getHouseholdId(request)
  const session = request.authSession
  const payload = candidateMergeSchema.parse(request.body)

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const result = await mergeRecurringCandidate(householdId, request.params.candidateId, payload)

  if (!result) {
    throw new ApiError(
      404,
      'CANDIDATE_OR_TARGET_NOT_FOUND',
      'The recurring candidate or merge target could not be found',
    )
  }

  await recordAuditEvent({
    id: `aud_${result.candidate.id}_${Date.now()}`,
    action: 'recurring.candidate.merge',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'recurring_candidate',
    entityId: result.candidate.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, result)
})

recurringRouter.post('/subscriptions', async (request, response) => {
  const payload = subscriptionSchema.parse(request.body)
  const session = request.authSession
  const householdId = getHouseholdId(request)

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const subscription = await createSubscription({
    householdId,
    name: payload.name,
    providerName: payload.providerName,
    category: payload.category,
    amount: payload.amount,
    cadence: payload.cadence,
    nextRenewalAt: payload.nextRenewalAt ?? null,
    ownershipScope: payload.ownershipScope,
    createdBy: session.userId,
  })

  await recordAuditEvent({
    id: `aud_${subscription.id}`,
    action: 'recurring.subscription.create',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'subscription',
    entityId: subscription.id,
    createdAt: new Date().toISOString(),
    metadata: {
      household_id: householdId,
      ownership_scope: subscription.ownershipScope,
    },
  })

  await recordProductEvent({
    eventName: 'manual_recurring.create',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      kind: 'subscription',
      recurringId: subscription.id,
      ownershipScope: subscription.ownershipScope,
    },
  })

  sendData(request, response, { subscription }, 201)
})

recurringRouter.patch('/subscriptions/:subscriptionId', async (request, response) => {
  const payload = subscriptionUpdateSchema.parse(request.body)
  const session = request.authSession
  const householdId = getHouseholdId(request)

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const subscription = await updateSubscription(householdId, request.params.subscriptionId, payload)

  if (!subscription) {
    throw new ApiError(404, 'SUBSCRIPTION_NOT_FOUND', 'The subscription could not be found')
  }

  await recordAuditEvent({
    id: `aud_${subscription.id}_${Date.now()}`,
    action: 'recurring.subscription.update',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'subscription',
    entityId: subscription.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, { subscription })
})

recurringRouter.post('/utilities', async (request, response) => {
  const payload = utilitySchema.parse(request.body)
  const session = request.authSession
  const householdId = getHouseholdId(request)

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const utilityBill = await createUtilityBill({
    householdId,
    providerName: payload.providerName,
    category: payload.category,
    typicalAmount: payload.typicalAmount,
    cadence: payload.cadence,
    nextDueAt: payload.nextDueAt ?? null,
    ownershipScope: payload.ownershipScope,
    createdBy: session.userId,
  })

  await recordAuditEvent({
    id: `aud_${utilityBill.id}`,
    action: 'recurring.utility.create',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'utility_bill',
    entityId: utilityBill.id,
    createdAt: new Date().toISOString(),
    metadata: {
      household_id: householdId,
      ownership_scope: utilityBill.ownershipScope,
    },
  })

  await recordProductEvent({
    eventName: 'manual_recurring.create',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      kind: 'utility',
      recurringId: utilityBill.id,
      ownershipScope: utilityBill.ownershipScope,
    },
  })

  sendData(request, response, { utilityBill }, 201)
})

recurringRouter.patch('/utilities/:utilityBillId', async (request, response) => {
  const payload = utilityUpdateSchema.parse(request.body)
  const session = request.authSession
  const householdId = getHouseholdId(request)

  if (!session) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A session token is required')
  }

  const utilityBill = await updateUtilityBill(householdId, request.params.utilityBillId, payload)

  if (!utilityBill) {
    throw new ApiError(404, 'UTILITY_BILL_NOT_FOUND', 'The utility bill could not be found')
  }

  await recordAuditEvent({
    id: `aud_${utilityBill.id}_${Date.now()}`,
    action: 'recurring.utility.update',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'utility_bill',
    entityId: utilityBill.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, { utilityBill })
})

function getHouseholdId(request: Express.Request) {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before recurring items can be managed',
    )
  }

  return householdId
}
