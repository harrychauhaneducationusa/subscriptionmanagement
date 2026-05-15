import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearStoredSession, getStoredSession, saveStoredSession } from './session'

const sampleSession = {
  sessionId: 'ses_test',
  userId: 'usr_test',
  phoneNumberMasked: '+91******00',
  householdId: 'hh_test',
  householdName: 'Test household',
}

describe('session storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(getStoredSession()).toBeNull()
  })

  it('round-trips a valid session', () => {
    saveStoredSession(sampleSession)
    expect(getStoredSession()).toEqual(sampleSession)
  })

  it('returns null for invalid JSON and clearStoredSession removes data', () => {
    sessionStorage.setItem('subsense.session', '{not-json')
    expect(getStoredSession()).toBeNull()
    saveStoredSession(sampleSession)
    clearStoredSession()
    expect(getStoredSession()).toBeNull()
  })
})
