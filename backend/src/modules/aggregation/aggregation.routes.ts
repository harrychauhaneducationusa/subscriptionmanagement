import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { logger } from '../../config/logger.js'
import { isAggregationSessionMockEnabled } from '../../config/env.js'
import { requireSession } from '../../middleware/requireSession.js'
import { rateLimitRedis } from '../../middleware/rateLimitRedis.js'
import { requireAggregationCallbackSecret } from '../../middleware/requireAggregationCallbackSecret.js'
import { ApiError, sendData } from '../../lib/http.js'
import { recordProductEvent } from '../analytics/analytics.service.js'
import { recordAuditEvent } from '../audit/audit.service.js'
import { getAggregationProviderAdapter, getAggregationProviderForConsent } from './aggregation.adapterRegistry.js'
import { createPlaidLinkToken } from './plaid/plaidClient.js'
import { completePlaidLinkExchange } from './plaid/plaidExchange.js'
import { env } from '../../config/env.js'
import { parseProviderCallbackPayload } from './callbackPayload.js'
import {
  createConsentSession,
  getConsentState,
  listInstitutionLinks,
  resolveInternalConsentId,
  startInstitutionLinkSync,
} from './aggregation.store.js'
import { enqueueAggregationLifecycleJob } from './aggregation.jobs.js'
import type { ParsedProviderCallback } from './providers/provider.types.js'

const createConsentSchema = z.object({
  institutionName: z.string().min(1),
  purpose: z
    .string()
    .min(1)
    .default('Analyze recurring subscriptions and bills from consented bank accounts.'),
  scope: z
    .array(z.string())
    .min(1)
    .default(['account_summary', 'transaction_history']),
})

const mockConsentCallbackSchema = z.object({
  eventType: z.enum(['consent.approved', 'consent.failed', 'consent.revoked']),
})

const plaidExchangeSchema = z.object({
  consentId: z.string().min(1),
  publicToken: z.string().min(1),
})

const setuCallbackLimiter = rateLimitRedis({
  windowSeconds: 60,
  max: 120,
  keyPrefix: 'aggregation-callback-setu',
})

export const aggregationRouter = Router()

aggregationRouter.post(
  '/callbacks/setu',
  setuCallbackLimiter,
  requireAggregationCallbackSecret,
  async (request, response) => {
    const parsed = parseProviderCallbackPayload(request.body)
    const internalConsentId = await resolveInternalConsentId(parsed.consentId)

    if (!internalConsentId) {
      throw new ApiError(
        404,
        'CONSENT_NOT_FOUND',
        'No consent matched this callback reference; verify provider_consent_ref is stored after Create Consent',
      )
    }

    const normalized: ParsedProviderCallback = {
      ...parsed,
      consentId: internalConsentId,
    }

    await handleSetuCallback(request, response, normalized)
  },
)

aggregationRouter.use(requireSession)

aggregationRouter.post('/plaid/exchange', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before completing Plaid Link',
    )
  }

  const body = plaidExchangeSchema.parse(request.body)
  const result = await completePlaidLinkExchange({
    householdId,
    consentId: body.consentId,
    publicToken: body.publicToken,
  })

  try {
    await recordProductEvent({
      eventName: 'bank_link.success',
      householdId,
      userId: session.userId,
      sessionId: session.sessionId,
      properties: {
        consentId: body.consentId,
        provider: 'plaid',
      },
    })
  } catch (error) {
    logger.warn({ error, consentId: body.consentId }, 'recordProductEvent failed after Plaid exchange')
  }

  sendData(request, response, result)
})

aggregationRouter.post('/consents/:consentId/mock-callback', async (request, response) => {
  if (!isAggregationSessionMockEnabled()) {
    throw new ApiError(404, 'NOT_FOUND', 'Not found')
  }

  const householdId = request.authSession?.defaultHouseholdId

  if (!request.authSession || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before simulating a provider callback',
    )
  }

  const consentId = request.params.consentId
  const body = mockConsentCallbackSchema.parse(request.body)
  const state = await getConsentState(householdId, consentId)

  if (!state) {
    throw new ApiError(404, 'CONSENT_NOT_FOUND', 'The consent session could not be found')
  }

  const callback: ParsedProviderCallback = {
    provider: 'setu_aa',
    consentId,
    eventType: body.eventType,
  }

  await handleSetuCallback(request, response, callback)
})

aggregationRouter.post('/consents', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before bank linking can begin',
    )
  }

  const payload = createConsentSchema.parse(request.body)
  const { consent, link } = await createConsentSession({
    householdId,
    institutionName: payload.institutionName,
    purpose: payload.purpose,
    scope: payload.scope,
    provider: getAggregationProviderForConsent(),
  })

  const adapter = getAggregationProviderAdapter()
  const redirect = await adapter.buildConsentRedirect({
    consentId: consent.id,
    institutionName: consent.institutionName,
    returnPath: `/app/bank-link?consentId=${consent.id}`,
  })

  await recordAuditEvent({
    id: `aud_${consent.id}`,
    action: 'aggregation.consent.create',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'consent',
    entityId: consent.id,
    createdAt: new Date().toISOString(),
    metadata: {
      household_id: householdId,
      institution_name: consent.institutionName,
    },
  })

  await recordProductEvent({
    eventName: 'bank_link.start',
    householdId,
    userId: session.userId,
    sessionId: session.sessionId,
    properties: {
      institutionName: consent.institutionName,
    },
  })

  sendData(request, response, {
    consent,
    linkPreview: link,
    redirect,
  }, 201)
})

aggregationRouter.get('/consents/:id/plaid-link-token', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before loading Plaid Link',
    )
  }

  if (env.AGGREGATION_PROVIDER !== 'plaid') {
    throw new ApiError(400, 'PLAID_NOT_ENABLED', 'Plaid is not the active aggregation provider')
  }

  const state = await getConsentState(householdId, request.params.id)

  if (!state) {
    throw new ApiError(404, 'CONSENT_NOT_FOUND', 'The consent session could not be found')
  }

  if (state.consent.provider !== 'plaid') {
    throw new ApiError(400, 'CONSENT_PROVIDER_MISMATCH', 'This consent is not a Plaid session')
  }

  const linkToken = await createPlaidLinkToken(state.consent.id)

  sendData(request, response, {
    link_token: linkToken,
    redirect_uri: `${env.FRONTEND_URL.replace(/\/$/, '')}/app/bank-link`,
  })
})

aggregationRouter.get('/consents/:id', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before consent state can be loaded',
    )
  }

  const state = await getConsentState(householdId, request.params.id)

  if (!state) {
    throw new ApiError(404, 'CONSENT_NOT_FOUND', 'The consent session could not be found')
  }

  sendData(request, response, {
    consent: state.consent,
    institutionLink: {
      ...state.link,
      freshness: buildFreshness(
        state.link.lastSuccessfulSyncAt,
        state.link.linkStatus,
        state.link.lastFailureReason,
      ),
    },
  })
})

aggregationRouter.get('/links', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before institution links can be listed',
    )
  }

  const links = await listInstitutionLinks(householdId)

  sendData(request, response, {
    links: links.map((link) => ({
      ...link,
      freshness: buildFreshness(link.lastSuccessfulSyncAt, link.linkStatus, link.lastFailureReason),
    })),
    empty_state: links.length === 0 ? 'manual_only' : null,
  })
})

aggregationRouter.post('/links/:id/refresh', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before refreshing a link',
    )
  }

  const queuedLink = await startInstitutionLinkSync(householdId, request.params.id, 'refresh')

  if (!queuedLink) {
    throw new ApiError(404, 'LINK_NOT_FOUND', 'The institution link could not be found')
  }

  const enqueueResult = await enqueueAggregationLifecycleJob({
    type: 'link.refresh',
    householdId,
    linkId: request.params.id,
  })

  await recordAuditEvent({
    id: `aud_${queuedLink.id}_${Date.now()}`,
    action: 'aggregation.link.refresh',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'institution_link',
    entityId: queuedLink.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, {
    link: {
      ...queuedLink,
      freshness: buildFreshness(
        queuedLink.lastSuccessfulSyncAt,
        queuedLink.linkStatus,
        queuedLink.lastFailureReason,
      ),
    },
    enqueue: enqueueResult,
  })
})

aggregationRouter.post('/links/:id/repair', async (request, response) => {
  const session = request.authSession
  const householdId = session?.defaultHouseholdId

  if (!session || !householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before repairing a link',
    )
  }

  const link = await startInstitutionLinkSync(householdId, request.params.id, 'repair')

  if (!link) {
    throw new ApiError(404, 'LINK_NOT_FOUND', 'The institution link could not be found')
  }

  const enqueueResult = await enqueueAggregationLifecycleJob({
    type: 'link.repair',
    householdId,
    linkId: request.params.id,
  })

  await recordAuditEvent({
    id: `aud_${link.id}_${Date.now()}`,
    action: 'aggregation.link.repair',
    actorType: 'user',
    actorId: session.userId,
    entityType: 'institution_link',
    entityId: link.id,
    createdAt: new Date().toISOString(),
  })

  sendData(request, response, {
    link: {
      ...link,
      freshness: buildFreshness(link.lastSuccessfulSyncAt, link.linkStatus, link.lastFailureReason),
    },
    enqueue: enqueueResult,
  })
})

async function handleSetuCallback(
  request: Request,
  response: Response,
  callback: ParsedProviderCallback,
) {
  const enqueueResult = await enqueueAggregationLifecycleJob({
    type: 'consent.callback',
    consentId: callback.consentId,
    eventType: callback.eventType,
  })

  try {
    await recordProductEvent({
      eventName:
        callback.eventType === 'consent.approved'
          ? 'bank_link.success'
          : 'bank_link.failure',
      properties: {
        consentId: callback.consentId,
        eventType: callback.eventType,
      },
    })
  } catch (error) {
    logger.warn(
      { error, consentId: callback.consentId, eventType: callback.eventType },
      'recordProductEvent failed after aggregation callback; response still succeeds',
    )
  }

  sendData(request, response, {
    accepted: enqueueResult.accepted,
    mode: enqueueResult.mode,
    callback,
  })
}

function buildFreshness(
  lastSuccessfulSyncAt: string | null,
  linkStatus: string,
  lastFailureReason?: string | null,
) {
  if (linkStatus === 'syncing') {
    return {
      status: 'syncing',
      last_successful_sync_at: lastSuccessfulSyncAt,
      stale_after: null,
      message: 'Sync is currently in progress',
    }
  }

  if (linkStatus === 'repair_required' || linkStatus === 'failed') {
    return {
      status: 'needs_repair',
      last_successful_sync_at: lastSuccessfulSyncAt,
      stale_after: null,
      message: lastFailureReason ?? 'The connection needs repair before the next sync',
    }
  }

  if (linkStatus === 'disconnected') {
    return {
      status: 'unavailable',
      last_successful_sync_at: lastSuccessfulSyncAt,
      stale_after: null,
      message: lastFailureReason ?? 'The bank connection is no longer active',
    }
  }

  if (!lastSuccessfulSyncAt) {
    return {
      status: linkStatus === 'pending' ? 'syncing' : 'unavailable',
      last_successful_sync_at: null,
      stale_after: null,
      message:
        linkStatus === 'pending'
          ? 'Waiting for consent completion before first sync'
          : 'No successful sync has happened yet',
    }
  }

  return {
    status: 'fresh',
    last_successful_sync_at: lastSuccessfulSyncAt,
    stale_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    message: 'Updated from consented bank data recently',
  }
}
