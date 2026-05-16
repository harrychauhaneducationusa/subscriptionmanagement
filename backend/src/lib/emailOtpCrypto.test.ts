import { describe, expect, it } from 'vitest'
import { generateNumericOtp, hashEmailOtp, verifyEmailOtpHash } from './emailOtpCrypto.js'

describe('emailOtpCrypto', () => {
  it('generateNumericOtp returns fixed width digits', () => {
    const code = generateNumericOtp(6)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('hashEmailOtp and verifyEmailOtpHash round-trip in non-production (dev pepper)', () => {
    const h = hashEmailOtp('123456')
    expect(verifyEmailOtpHash('123456', h)).toBe(true)
    expect(verifyEmailOtpHash('000000', h)).toBe(false)
  })

  it('verifyEmailOtpHash returns false on malformed hash', () => {
    expect(verifyEmailOtpHash('123456', 'not-hex')).toBe(false)
  })
})
