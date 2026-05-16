import { expect, test } from '@playwright/test'
import {
  E2E_STREAMING_PROVIDERS,
  cancelE2eSeedSubscriptions,
  fetchDashboardSummary,
  PLAYWRIGHT_API_BASE,
  postStreamingSubscription,
  readBearerFromPage,
  uniqueTestPhoneE164,
} from './helpers/test-api'

const DEV_OTP = process.env.PLAYWRIGHT_DEV_OTP ?? '123456'

test.describe('Recommendations + curated alternatives (requires `npm run dev`, DB)', () => {
  test.beforeAll(async ({ request }) => {
    const live = await request.get(`${PLAYWRIGHT_API_BASE}/v1/health/live`)
    expect(live.ok(), `API not reachable at ${PLAYWRIGHT_API_BASE}/v1/health/live`).toBeTruthy()
  })

  test('seeded streaming subs yield open recs and manual-catalog alternatives (API + UI)', async ({
    page,
    request,
  }) => {
    const phone = uniqueTestPhoneE164()

    await page.goto('/session')
    await page.getByLabel('Phone number').fill(phone)
    await page.getByLabel('OTP code').fill(DEV_OTP)
    await page.getByRole('button', { name: /Verify OTP and create session/i }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 45_000 })

    const bearer = await readBearerFromPage(page)

    await cancelE2eSeedSubscriptions(request, bearer)
    await postStreamingSubscription(request, bearer, 'E2E Streaming Alpha', E2E_STREAMING_PROVIDERS[0])
    await postStreamingSubscription(request, bearer, 'E2E Streaming Beta', E2E_STREAMING_PROVIDERS[1])

    const summary = await fetchDashboardSummary(request, bearer)
    expect(summary.summary.openRecommendationCount ?? 0).toBeGreaterThan(0)
    expect(summary.recommendations.length).toBeGreaterThan(0)

    const withAlternatives = summary.recommendations.filter((r) => (r.alternatives?.length ?? 0) > 0)
    expect(
      withAlternatives.length,
      'Expected at least one open recommendation with non-empty alternatives (streaming inventory)',
    ).toBeGreaterThan(0)

    await page.reload()
    await expect(page.getByText(/Review overlapping subscription spend/i)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Curated options to explore \(manual catalog\)/i).first()).toBeVisible()
    await expect(page.getByText(/Drop to ad-supported or lower resolution tier/i).first()).toBeVisible()
  })
})
