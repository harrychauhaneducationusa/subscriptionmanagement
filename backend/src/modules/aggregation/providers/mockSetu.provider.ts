import { z } from 'zod'
import type { AggregationProviderAdapter } from './provider.types.js'

const callbackSchema = z.object({
  consentId: z.string().min(1),
  eventType: z.enum(['consent.approved', 'consent.failed', 'consent.revoked']),
})

export const mockSetuProviderAdapter: AggregationProviderAdapter = {
  provider: 'setu_aa',
  providerName: 'Setu AA (mock)',
  buildConsentRedirect(input) {
    const params = new URLSearchParams({
      consentId: input.consentId,
      institutionName: input.institutionName,
      returnPath: input.returnPath,
    })

    return {
      provider_name: this.providerName,
      redirect_url: `https://mock-setu-aa.local/consent?${params.toString()}`,
      return_path: input.returnPath,
      status: 'pending_user_action',
    }
  },
  parseCallback(payload) {
    const parsed = callbackSchema.parse(payload)

    return {
      provider: 'setu_aa',
      consentId: parsed.consentId,
      eventType: parsed.eventType,
    }
  },
}
