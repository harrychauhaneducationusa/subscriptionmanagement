import { z } from 'zod'
import { ApiError } from '../../lib/http.js'
import type { ConsentCallbackEvent, ParsedProviderCallback } from './providers/provider.types.js'

const mockCallbackSchema = z.object({
  consentId: z.string().min(1),
  eventType: z.enum(['consent.approved', 'consent.failed', 'consent.revoked']),
})

const setuConsentNotificationSchema = z.object({
  type: z.literal('CONSENT_STATUS_UPDATE'),
  consentId: z.string().min(1),
  success: z.boolean(),
  data: z
    .object({
      status: z.string(),
    })
    .nullable()
    .optional(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .nullable()
    .optional(),
})

function mapSetuConsentStatusToEvent(
  success: boolean,
  status: string | undefined,
  error: z.infer<typeof setuConsentNotificationSchema>['error'],
): ConsentCallbackEvent {
  if (!success || error) {
    return 'consent.failed'
  }

  const normalized = (status ?? '').toUpperCase()

  if (normalized === 'ACTIVE') {
    return 'consent.approved'
  }

  if (normalized === 'REVOKED') {
    return 'consent.revoked'
  }

  return 'consent.failed'
}

/**
 * Accepts either the in-app mock callback body or Setu's `CONSENT_STATUS_UPDATE` webhook payload.
 */
export function parseProviderCallbackPayload(payload: unknown): ParsedProviderCallback {
  const setuParsed = setuConsentNotificationSchema.safeParse(payload)

  if (setuParsed.success) {
    const eventType = mapSetuConsentStatusToEvent(
      setuParsed.data.success,
      setuParsed.data.data?.status,
      setuParsed.data.error,
    )

    return {
      provider: 'setu_aa',
      consentId: setuParsed.data.consentId,
      eventType,
    }
  }

  const mockParsed = mockCallbackSchema.safeParse(payload)

  if (mockParsed.success) {
    return {
      provider: 'setu_aa',
      consentId: mockParsed.data.consentId,
      eventType: mockParsed.data.eventType,
    }
  }

  throw new ApiError(
    400,
    'AGGREGATION_CALLBACK_PAYLOAD_INVALID',
    'Callback body must be a Setu CONSENT_STATUS_UPDATE notification or the mock consent callback shape',
  )
}
