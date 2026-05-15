import { expect, test } from '@playwright/test'

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000'

test.describe('MVP smoke (requires `npm run dev` — API, DB, Redis, Vite)', () => {
  test.beforeAll(async ({ request }) => {
    const live = await request.get(`${apiBase}/v1/health/live`)
    expect(
      live.ok(),
      `API not reachable at ${apiBase}/v1/health/live — start the stack from the repo root (npm run dev).`,
    ).toBeTruthy()
  })

  test('landing shows primary value proposition', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: /Understand your recurring spending/i }),
    ).toBeVisible()
  })

  test('phone OTP → dashboard → Ops snapshot', async ({ page }) => {
    await page.goto('/session')
    await expect(page.getByRole('heading', { name: /Save your setup securely/i })).toBeVisible()
    await page.getByRole('button', { name: /Verify OTP and create session/i }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: /Recurring intelligence with first actions/i })).toBeVisible()

    await page.goto('/app/ops')
    await expect(page.getByRole('heading', { name: /Operations and funnel snapshot/i })).toBeVisible()
    await expect(page.getByText(/Overall status:/i)).toBeVisible()
  })
})
