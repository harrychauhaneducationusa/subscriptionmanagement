export type AggregationProvider = 'setu_aa'

export type ConsentCallbackEvent =
  | 'consent.approved'
  | 'consent.failed'
  | 'consent.revoked'

export type ConsentRedirectDescriptor = {
  provider_name: string
  redirect_url: string
  return_path: string
  status: 'pending_user_action'
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
