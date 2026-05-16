import { env } from '../../config/env.js'
import { mockSetuProviderAdapter } from './providers/mockSetu.provider.js'
import { plaidProviderAdapter } from './providers/plaid.provider.js'
import { setuAaProviderAdapter } from './providers/setuAa.provider.js'
import type { AggregationProviderAdapter } from './providers/provider.types.js'

export function getAggregationProviderAdapter(): AggregationProviderAdapter {
  switch (env.AGGREGATION_PROVIDER) {
    case 'setu':
      return setuAaProviderAdapter
    case 'plaid':
      return plaidProviderAdapter
    default:
      return mockSetuProviderAdapter
  }
}

export function getAggregationProviderForConsent(): 'setu_aa' | 'plaid' {
  return env.AGGREGATION_PROVIDER === 'plaid' ? 'plaid' : 'setu_aa'
}
