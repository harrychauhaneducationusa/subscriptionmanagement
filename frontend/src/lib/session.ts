export type StoredSession = {
  sessionId: string
  userId: string
  phoneNumberMasked: string
  householdId: string
  householdName: string
}

const storageKey = 'subsense.session'

export function getStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.sessionStorage.getItem(storageKey)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as StoredSession
  } catch {
    return null
  }
}

export function saveStoredSession(session: StoredSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(storageKey)
}
