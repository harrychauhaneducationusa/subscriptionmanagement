import { createPlaidLinkToken } from '../plaid/plaidClient.js'
import type { AggregationProviderAdapter } from './provider.types.js'

export const plaidProviderAdapter: AggregationProviderAdapter = {
  provider: 'plaid',
  providerName: 'Plaid',
  async buildConsentRedirect(input) {
    const linkToken = await createPlaidLinkToken(input.consentId)

    return {
      provider_name: this.providerName,
      redirect_url: '',
      link_token: linkToken,
      return_path: input.returnPath,
      status: 'pending_user_action',
    }
  },
  parseCallback() {
    throw new Error('Plaid completion uses POST /v1/aggregation/plaid/exchange, not parseCallback')
  },
}
