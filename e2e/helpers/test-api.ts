import type { APIRequestContext, Page } from '@playwright/test'

export const PLAYWRIGHT_API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000'

/** Stable provider names so reruns can cancel prior E2E rows before inserting fresh ones. */
export const E2E_STREAMING_PROVIDERS = ['__E2E_STREAMING_A__', '__E2E_STREAMING_B__'] as const

const e2eStreamingProviderSet = new Set<string>(E2E_STREAMING_PROVIDERS)

export function uniqueTestPhoneE164(): string {
  const n = Math.floor(1_000_000 + Math.random() * 8_999_999)
  return `+1555000${n}`
}

export async function readBearerFromPage(page: Page): Promise<string> {
  const raw = await page.evaluate(() => window.sessionStorage.getItem('subsense.session'))
  if (!raw) {
    throw new Error('subsense.session missing from sessionStorage after login')
  }
  const parsed = JSON.parse(raw) as { sessionId?: string }
  if (!parsed.sessionId) {
    throw new Error('subsense.session JSON has no sessionId')
  }
  return `Bearer ${parsed.sessionId}`
}

type RecurringListItem = {
  id: string
  kind: string
  providerName: string
  status: string
}

export async function cancelE2eSeedSubscriptions(
  request: APIRequestContext,
  bearer: string,
): Promise<void> {
  const res = await request.get(`${PLAYWRIGHT_API_BASE}/v1/recurring/`, {
    headers: { Authorization: bearer },
  })
  if (!res.ok()) {
    throw new Error(`GET /v1/recurring failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { data: { items: RecurringListItem[] } }
  const items = body.data.items ?? []

  for (const item of items) {
    if (item.kind === 'subscription' && e2eStreamingProviderSet.has(item.providerName) && item.status === 'active') {
      const patch = await request.patch(`${PLAYWRIGHT_API_BASE}/v1/recurring/subscriptions/${item.id}`, {
        headers: { Authorization: bearer, 'Content-Type': 'application/json' },
        data: { status: 'cancelled' },
      })
      if (!patch.ok()) {
        throw new Error(`PATCH cancel subscription failed: ${patch.status()} ${await patch.text()}`)
      }
    }
  }
}

export async function postStreamingSubscription(
  request: APIRequestContext,
  bearer: string,
  name: string,
  providerName: string,
): Promise<void> {
  const res = await request.post(`${PLAYWRIGHT_API_BASE}/v1/recurring/subscriptions`, {
    headers: { Authorization: bearer, 'Content-Type': 'application/json' },
    data: {
      name,
      providerName,
      category: 'streaming',
      amount: 649,
      cadence: 'monthly',
      nextRenewalAt: null,
      ownershipScope: 'personal',
    },
  })
  if (!res.ok()) {
    throw new Error(`POST /v1/recurring/subscriptions failed: ${res.status()} ${await res.text()}`)
  }
}

type DashboardSummaryBody = {
  data: {
    recommendations: Array<{ alternatives?: unknown[]; title?: string }>
    summary: { openRecommendationCount?: number }
  }
}

export async function fetchDashboardSummary(
  request: APIRequestContext,
  bearer: string,
): Promise<DashboardSummaryBody['data']> {
  const res = await request.get(`${PLAYWRIGHT_API_BASE}/v1/insights/dashboard-summary`, {
    headers: { Authorization: bearer },
  })
  if (!res.ok()) {
    throw new Error(`GET /v1/insights/dashboard-summary failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as DashboardSummaryBody
  return body.data
}
