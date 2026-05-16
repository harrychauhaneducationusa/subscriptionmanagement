import { describe, expect, it, vi } from 'vitest'

const mockGetDatabasePool = vi.hoisted(() => vi.fn(() => null))

vi.mock('../../config/database.js', () => ({
  getDatabasePool: mockGetDatabasePool,
}))

vi.mock('../../config/metrics.js', () => ({
  productEventCounter: { inc: vi.fn() },
}))

import {
  getLaunchReadinessAnalyticsSummary,
  isClientIngestibleProductEvent,
  recordProductEvent,
} from './analytics.service.js'

describe('analytics.service', () => {
  it('isClientIngestibleProductEvent is true only for allowlisted names', () => {
    expect(isClientIngestibleProductEvent('bank_link.screen.view')).toBe(true)
    expect(isClientIngestibleProductEvent('auth.verify_otp.success')).toBe(false)
  })

  it('recordProductEvent in-memory path does not throw', async () => {
    await expect(
      recordProductEvent({
        eventName: 'bank_link.screen.view',
        sessionId: 'ses_1',
      }),
    ).resolves.toBeUndefined()
  })

  it('getLaunchReadinessAnalyticsSummary returns zeros map with no pool', async () => {
    const summary = await getLaunchReadinessAnalyticsSummary()
    expect(summary['bank_link.start']).toBe(0)
    expect(summary['auth.verify_otp.success']).toBe(0)
  })

  it('getLaunchReadinessAnalyticsSummary reflects in-memory events', async () => {
    const before = (await getLaunchReadinessAnalyticsSummary())['bank_link.screen.view'] ?? 0
    await recordProductEvent({ eventName: 'bank_link.screen.view' })
    const summary = await getLaunchReadinessAnalyticsSummary()
    expect(summary['bank_link.screen.view']).toBe(before + 1)
  })

  it('getLaunchReadinessAnalyticsSummary reads counts from DB when pool exists', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        { event_name: 'bank_link.start', event_count: '2' },
        { event_name: 'bank_link.screen.view', event_count: 5 },
      ],
    })
    vi.mocked(mockGetDatabasePool).mockReturnValueOnce({ query } as never)

    const summary = await getLaunchReadinessAnalyticsSummary()

    expect(query).toHaveBeenCalled()
    expect(summary['bank_link.start']).toBe(2)
    expect(summary['bank_link.screen.view']).toBe(5)
  })
})
