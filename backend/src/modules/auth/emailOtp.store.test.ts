import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  getDatabasePool: vi.fn(() => null),
}))

vi.mock('../../lib/mailer.js', () => ({
  sendEmailOtpMessage: vi.fn(),
}))

import { env } from '../../config/env.js'
import { consumeEmailOtpIfValid, createEmailOtpChallenge, normalizeEmail } from './emailOtp.store.js'

describe('emailOtp.store (memory delivery)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizeEmail matches auth convention', () => {
    expect(normalizeEmail('  Test@Domain.IO ')).toBe('test@domain.io')
  })

  it('createEmailOtpChallenge then consumeEmailOtpIfValid succeeds with test code in test env', async () => {
    expect(env.NODE_ENV).toBe('test')

    const { requestId } = await createEmailOtpChallenge('user@example.com')
    const result = await consumeEmailOtpIfValid({
      requestId,
      email: 'user@example.com',
      code: env.OTP_TEST_CODE,
    })

    expect(result).toEqual({ ok: true, emailNormalized: 'user@example.com' })
  })

  it('consumeEmailOtpIfValid rejects wrong code', async () => {
    const { requestId } = await createEmailOtpChallenge('other@example.com')
    const result = await consumeEmailOtpIfValid({
      requestId,
      email: 'other@example.com',
      code: '000000',
    })

    expect(result).toEqual({ ok: false, reason: 'OTP_INVALID' })
  })

  it('consumeEmailOtpIfValid rejects unknown request', async () => {
    const result = await consumeEmailOtpIfValid({
      requestId: 'eml_does_not_exist',
      email: 'user@example.com',
      code: env.OTP_TEST_CODE,
    })

    expect(result).toEqual({ ok: false, reason: 'OTP_REQUEST_NOT_FOUND' })
  })
})
