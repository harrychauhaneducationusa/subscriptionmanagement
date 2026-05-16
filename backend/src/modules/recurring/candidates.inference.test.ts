import { describe, expect, it } from 'vitest'
import { inferRecurringCandidateType } from './candidates.store.js'

describe('inferRecurringCandidateType', () => {
  it('classifies utility merchants and categories', () => {
    expect(inferRecurringCandidateType('utility', 'food')).toBe('utility')
    expect(inferRecurringCandidateType('other', 'utilities')).toBe('utility')
    expect(inferRecurringCandidateType('other', 'internet')).toBe('utility')
  })

  it('classifies subscription merchants and categories', () => {
    expect(inferRecurringCandidateType('subscription', 'food')).toBe('subscription')
    expect(inferRecurringCandidateType('other', 'subscriptions')).toBe('subscription')
  })

  it('returns other_recurring when signals are weak', () => {
    expect(inferRecurringCandidateType('other', 'food')).toBe('other_recurring')
    expect(inferRecurringCandidateType(null, 'travel')).toBe('other_recurring')
  })
})
