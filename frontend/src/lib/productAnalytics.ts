import { api } from './api'
import { getStoredSession } from './session'

/**
 * Best-effort product analytics for authenticated flows. Never throws to callers.
 */
export async function trackProductEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const session = getStoredSession()

  if (!session?.sessionId) {
    return
  }

  try {
    await api.post('/v1/analytics/events', { eventName, properties })
  } catch {
    // Intentionally ignore network or validation errors for analytics.
  }
}
