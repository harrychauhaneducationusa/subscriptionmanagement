import { describe, expect, it } from 'vitest'
import { ApiError } from '../../lib/http.js'
import { parseProviderCallbackPayload } from './callbackPayload.js'

describe('parseProviderCallbackPayload', () => {
  it('parses Setu CONSENT_STATUS_UPDATE success ACTIVE as approved', () => {
    const parsed = parseProviderCallbackPayload({
      type: 'CONSENT_STATUS_UPDATE',
      consentId: 'con_1',
      success: true,
      data: { status: 'ACTIVE' },
    })

    expect(parsed).toEqual({
      provider: 'setu_aa',
      consentId: 'con_1',
      eventType: 'consent.approved',
    })
  })

  it('maps REVOKED to consent.revoked', () => {
    const parsed = parseProviderCallbackPayload({
      type: 'CONSENT_STATUS_UPDATE',
      consentId: 'con_2',
      success: true,
      data: { status: 'REVOKED' },
    })

    expect(parsed.eventType).toBe('consent.revoked')
  })

  it('maps success false to failed', () => {
    const parsed = parseProviderCallbackPayload({
      type: 'CONSENT_STATUS_UPDATE',
      consentId: 'con_3',
      success: false,
      data: { status: 'ACTIVE' },
    })

    expect(parsed.eventType).toBe('consent.failed')
  })

  it('maps error object to failed', () => {
    const parsed = parseProviderCallbackPayload({
      type: 'CONSENT_STATUS_UPDATE',
      consentId: 'con_4',
      success: true,
      error: { code: 'E', message: 'x' },
    })

    expect(parsed.eventType).toBe('consent.failed')
  })

  it('maps unknown status to failed', () => {
    const parsed = parseProviderCallbackPayload({
      type: 'CONSENT_STATUS_UPDATE',
      consentId: 'con_5',
      success: true,
      data: { status: 'PENDING' },
    })

    expect(parsed.eventType).toBe('consent.failed')
  })

  it('falls back to mock callback shape', () => {
    const parsed = parseProviderCallbackPayload({
      consentId: 'con_6',
      eventType: 'consent.approved',
    })

    expect(parsed).toEqual({
      provider: 'setu_aa',
      consentId: 'con_6',
      eventType: 'consent.approved',
    })
  })

  it('throws ApiError when payload is invalid', () => {
    expect(() => parseProviderCallbackPayload({ foo: 'bar' })).toThrow(ApiError)
  })
})
