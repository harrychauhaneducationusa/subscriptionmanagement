import { env } from '../../config/env.js'
import { mockSetuProviderAdapter } from './providers/mockSetu.provider.js'
import { setuAaProviderAdapter } from './providers/setuAa.provider.js'
import type { AggregationProviderAdapter } from './providers/provider.types.js'

export function getAggregationProviderAdapter(): AggregationProviderAdapter {
  return env.AGGREGATION_PROVIDER === 'setu' ? setuAaProviderAdapter : mockSetuProviderAdapter
}
