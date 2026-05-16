import { describe, expect, it } from 'vitest'
import { checkDatabaseHealth } from './database.js'
import { checkRedisHealth } from './redis.js'

describe('checkDatabaseHealth', () => {
  it('returns a well-formed status', async () => {
    const r = await checkDatabaseHealth()
    expect(['not_configured', 'available', 'unavailable']).toContain(r.status)
  })
})

describe('checkRedisHealth', () => {
  it('returns a well-formed status', async () => {
    const r = await checkRedisHealth()
    expect(['not_configured', 'available', 'unavailable']).toContain(r.status)
  })
})
