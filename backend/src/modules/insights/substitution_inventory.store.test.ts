import { describe, expect, it } from 'vitest'
import { listAlternativesForCategory } from './substitution_inventory.store.js'

describe('substitution_inventory.store', () => {
  it('returns alternatives for internet category', () => {
    const rows = listAlternativesForCategory('internet')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toMatchObject({
      id: expect.any(String),
      label: expect.any(String),
      source: 'manual_catalog',
      disclaimer: expect.any(String),
      lastVerifiedAt: expect.any(String),
    })
  })

  it('returns alternatives for utilities', () => {
    expect(listAlternativesForCategory('utilities').length).toBeGreaterThan(0)
  })

  it('returns alternatives for streaming', () => {
    expect(listAlternativesForCategory('streaming').length).toBeGreaterThan(0)
  })

  it('returns empty for unknown category', () => {
    expect(listAlternativesForCategory('unknown_xyz_category')).toEqual([])
  })

  it('normalizes category case', () => {
    expect(listAlternativesForCategory('INTERNET').length).toBeGreaterThan(0)
  })

  it('respects max limit', () => {
    expect(listAlternativesForCategory('internet', 1)).toHaveLength(1)
  })
})
