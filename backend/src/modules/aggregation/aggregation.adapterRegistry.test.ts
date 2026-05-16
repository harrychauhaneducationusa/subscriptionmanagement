import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getAggregationProviderAdapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns mock Setu adapter when AGGREGATION_PROVIDER=mock', async () => {
    vi.stubEnv('AGGREGATION_PROVIDER', 'mock')
    const { getAggregationProviderAdapter } = await import('./aggregation.adapterRegistry.js')
    const adapter = getAggregationProviderAdapter()
    expect(adapter.providerName).toBe('Setu AA (mock)')
  })

  it('returns Plaid adapter when AGGREGATION_PROVIDER=plaid', async () => {
    vi.stubEnv('AGGREGATION_PROVIDER', 'plaid')
    const { getAggregationProviderAdapter } = await import('./aggregation.adapterRegistry.js')
    const adapter = getAggregationProviderAdapter()
    expect(adapter.provider).toBe('plaid')
    expect(adapter.providerName).toBe('Plaid')
  })

  it('returns Setu AA adapter when AGGREGATION_PROVIDER=setu', async () => {
    vi.stubEnv('AGGREGATION_PROVIDER', 'setu')
    const { getAggregationProviderAdapter } = await import('./aggregation.adapterRegistry.js')
    const adapter = getAggregationProviderAdapter()
    expect(adapter.provider).toBe('setu_aa')
  })

  it('getAggregationProviderForConsent maps plaid vs setu_aa', async () => {
    vi.stubEnv('AGGREGATION_PROVIDER', 'plaid')
    const { getAggregationProviderForConsent } = await import('./aggregation.adapterRegistry.js')
    expect(getAggregationProviderForConsent()).toBe('plaid')

    vi.resetModules()
    vi.stubEnv('AGGREGATION_PROVIDER', 'setu')
    const mod = await import('./aggregation.adapterRegistry.js')
    expect(mod.getAggregationProviderForConsent()).toBe('setu_aa')
  })
})
