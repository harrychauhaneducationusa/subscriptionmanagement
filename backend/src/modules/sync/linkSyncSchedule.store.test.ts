import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

vi.mock('../../config/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}))

vi.mock('../../config/database.js', () => ({
  getDatabasePool: vi.fn(() => ({ query: mockQuery })),
}))

import {
  computeNextRunAtMs,
  intervalSecondsForTier,
  scheduleNextRunAfterIngestSuccess,
} from './linkSyncSchedule.store.js'

describe('linkSyncSchedule.store', () => {
  describe('tier helpers', () => {
    it('intervalSecondsForTier uses 24h for free and 6h for premium', () => {
      expect(intervalSecondsForTier('free')).toBe(24 * 60 * 60)
      expect(intervalSecondsForTier('premium')).toBe(6 * 60 * 60)
    })

    it('computeNextRunAtMs adds interval and deterministic jitter', () => {
      const now = 1_700_000_000_000
      const free = computeNextRunAtMs(now, 'free', 300, 60_000)
      expect(free).toBe(now + 24 * 60 * 60 * 1000 + 60_000)

      const premium = computeNextRunAtMs(now, 'premium', 300, 5_000)
      expect(premium).toBe(now + 6 * 60 * 60 * 1000 + 5_000)
    })
  })

  describe('scheduleNextRunAfterIngestSuccess', () => {
    beforeEach(() => {
      mockQuery.mockReset()
    })

    it('swallows undefined_table (42P01) when migrations are not applied', async () => {
      mockQuery.mockRejectedValueOnce(Object.assign(new Error('relation missing'), { code: '42P01' }))

      await expect(scheduleNextRunAfterIngestSuccess('lnk_x')).resolves.toBeUndefined()

      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('upserts schedule when tier defaults to free', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })

      await scheduleNextRunAfterIngestSuccess('lnk_y', new Date('2026-01-01T12:00:00.000Z'))

      expect(mockQuery).toHaveBeenCalledTimes(2)
      const insertArgs = mockQuery.mock.calls[1]?.[1] as unknown[] | undefined
      expect(insertArgs?.[0]).toBe('lnk_y')
      expect(insertArgs?.[1]).toBe('free')
    })
  })
})
