export type AggregationProvider = 'setu_aa' | 'plaid'

export type ConsentCallbackEvent =
  | 'consent.approved'
  | 'consent.failed'
  | 'consent.revoked'

export type ConsentRedirectDescriptor = {
  provider_name: string
  redirect_url: string
  return_path: string
  status: 'pending_user_action'
  /** Present when using Plaid Link (no browser redirect URL). */
  link_token?: string
}

export type ParsedProviderCallback = {
  provider: AggregationProvider
  consentId: string
  eventType: ConsentCallbackEvent
}

export interface AggregationProviderAdapter {
  provider: AggregationProvider
  providerName: string
  buildConsentRedirect(input: {
    consentId: string
    institutionName: string
    returnPath: string
  }): Promise<ConsentRedirectDescriptor>
  parseCallback(payload: unknown): ParsedProviderCallback
}
