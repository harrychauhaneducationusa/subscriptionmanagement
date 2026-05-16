import { expect, test } from '@playwright/test'

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000'

/**
 * Deeper smoke: after dev OTP login, the dashboard must expose the surfaces that carry
 * customer value (visibility, next actions, explainability)—even for an empty household.
 */
test.describe('Customer value — dashboard surfaces (requires `npm run dev`)', () => {
  test.beforeAll(async ({ request }) => {
    const live = await request.get(`${apiBase}/v1/health/live`)
    expect(live.ok(), `API not reachable at ${apiBase}/v1/health/live`).toBeTruthy()
  })

  test('post-login dashboard shows recurring, signals, savings, and insight scaffolding', async ({ page }) => {
    await page.goto('/session')
    await page.getByRole('button', { name: /Verify OTP and create session/i }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 45_000 })

    await expect(page.getByRole('heading', { name: /Recurring intelligence with first actions/i })).toBeVisible()

    await expect(page.getByRole('heading', { name: /Add a subscription/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Add a utility bill/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Detected recurring review/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Recurring items/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Summary signals/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Savings recommendations/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Insight feed/i })).toBeVisible()

    await expect(
      page.getByText(/Deterministic recommendations are generated from tracked recurring data/i),
    ).toBeVisible()
    await expect(
      page.getByText(/Grounded insight events explain the latest dashboard state/i),
    ).toBeVisible()
  })
})
