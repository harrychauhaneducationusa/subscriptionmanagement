import { api } from './api'
import { saveStoredSession } from './session'

type HouseholdType = 'individual' | 'couple' | 'family' | 'shared_household'

type HouseholdResponse = {
  data: {
    household: {
      id: string
      name: string
      type: HouseholdType
    }
  }
}

export type SessionPayload = {
  sessionId: string
  userId: string
  phoneNumberMasked: string
  defaultHouseholdId: string | null
}

export async function finalizeAuthenticatedSession(
  session: SessionPayload,
  householdType: HouseholdType | undefined,
) {
  const resolvedType = householdType ?? 'individual'

  const householdName =
    resolvedType === 'family'
      ? 'My Family'
      : resolvedType === 'couple'
        ? 'Our Home'
        : 'My Recurring Spend'

  const householdResponse =
    session.defaultHouseholdId === null
      ? await api.post<HouseholdResponse>(
          '/v1/households',
          {
            name: householdName,
            type: resolvedType,
          },
          {
            headers: {
              Authorization: `Bearer ${session.sessionId}`,
            },
          },
        )
      : await api.get<HouseholdResponse>('/v1/households/current', {
          headers: {
            Authorization: `Bearer ${session.sessionId}`,
          },
        })

  const household = householdResponse.data.data.household

  saveStoredSession({
    sessionId: session.sessionId,
    userId: session.userId,
    phoneNumberMasked: session.phoneNumberMasked,
    householdId: household.id,
    householdName: household.name,
  })

  return { household }
}
