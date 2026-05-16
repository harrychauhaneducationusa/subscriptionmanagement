import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  getDatabasePool: vi.fn(() => null),
}))

import {
  createOtpRequest,
  createSession,
  findOrCreateVerifiedUser,
  getOtpRequest,
  getSession,
  maskEmail,
  maskPhoneNumber,
  normalizeEmail,
  setDefaultHouseholdForUserAndSession,
} from './auth.store.js'

describe('auth masking and normalization', () => {
  it('maskPhoneNumber keeps last four digits', () => {
    expect(maskPhoneNumber('+15551234567')).toBe('******4567')
  })

  it('normalizeEmail lowercases and trims', () => {
    expect(normalizeEmail('  Hello@Example.COM ')).toBe('hello@example.com')
  })

  it('maskEmail obfuscates local part', () => {
    expect(maskEmail('alice@example.com')).toMatch(/\*\*\*@example\.com/)
  })
})

describe('auth in-memory path (no DATABASE_URL)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('createOtpRequest → getOtpRequest round-trip', async () => {
    const { requestId } = await createOtpRequest('+15550001111')
    const fetched = await getOtpRequest(requestId)
    expect(fetched?.phoneNumber).toBe('+15550001111')
  })

  it('findOrCreateVerifiedUser creates then reuses user', async () => {
    const phone = '+15552223333'
    const first = await findOrCreateVerifiedUser(phone)
    const second = await findOrCreateVerifiedUser(phone)
    expect(first.id).toBe(second.id)
    expect(first.phoneNumberMasked).toBe('******3333')
  })

  it('createSession → getSession and setDefaultHouseholdForUserAndSession', async () => {
    const user = await findOrCreateVerifiedUser('+15554445555')
    const session = await createSession({
      userId: user.id,
      phoneNumberMasked: user.phoneNumberMasked,
      defaultHouseholdId: null,
    })

    const loaded = await getSession(session.sessionId)
    expect(loaded?.userId).toBe(user.id)
    expect(loaded?.defaultHouseholdId).toBeNull()

    await setDefaultHouseholdForUserAndSession({
      userId: user.id,
      sessionId: session.sessionId,
      householdId: 'hh_test_1',
    })

    const updated = await getSession(session.sessionId)
    expect(updated?.defaultHouseholdId).toBe('hh_test_1')
  })
})
