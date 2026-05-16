import { describe, expect, it } from 'vitest'
import { mockSetuProviderAdapter } from './mockSetu.provider.js'

describe('mockSetuProviderAdapter', () => {
  it('buildConsentRedirect includes consent and institution in mock URL', async () => {
    const redirect = await mockSetuProviderAdapter.buildConsentRedirect({
      consentId: 'con_test',
      institutionName: 'HDFC Bank',
      returnPath: '/app/bank-link?consentId=con_test',
    })

    expect(redirect.provider_name).toBe('Setu AA (mock)')
    expect(redirect.status).toBe('pending_user_action')
    expect(redirect.redirect_url).toContain('https://mock-setu-aa.local/consent?')
    expect(redirect.redirect_url).toContain('consentId=con_test')
    expect(redirect.redirect_url).toContain('institutionName=')
    expect(redirect.return_path).toBe('/app/bank-link?consentId=con_test')
  })

  it('parseCallback maps payload to consent event', () => {
    const parsed = mockSetuProviderAdapter.parseCallback({
      consentId: 'con_abc',
      eventType: 'consent.approved',
    })

    expect(parsed).toEqual({
      provider: 'setu_aa',
      consentId: 'con_abc',
      eventType: 'consent.approved',
    })
  })

  it('parseCallback rejects invalid event type', () => {
    const payload = { consentId: 'con_abc', eventType: 'invalid_event' }
    expect(() => mockSetuProviderAdapter.parseCallback(payload as never)).toThrow()
  })
})
