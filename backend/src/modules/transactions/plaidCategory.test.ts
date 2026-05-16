import { describe, expect, it } from 'vitest'
import {
  mapPlaidPersonalFinanceCategory,
  resolveTransactionCategory,
} from './plaidCategory.js'

describe('mapPlaidPersonalFinanceCategory', () => {
  it('maps common Plaid primary categories', () => {
    expect(mapPlaidPersonalFinanceCategory('FOOD_AND_DRINK')).toBe('food')
    expect(mapPlaidPersonalFinanceCategory('TRAVEL')).toBe('travel')
    expect(mapPlaidPersonalFinanceCategory('TRANSPORTATION')).toBe('transportation')
    expect(mapPlaidPersonalFinanceCategory('TRANSFER_OUT')).toBe('transfers')
    expect(mapPlaidPersonalFinanceCategory('LOAN_PAYMENTS')).toBe('loan_payments')
  })

  it('returns null for unknown categories', () => {
    expect(mapPlaidPersonalFinanceCategory('UNKNOWN_CATEGORY_XYZ')).toBeNull()
    expect(mapPlaidPersonalFinanceCategory(null)).toBeNull()
  })
})

describe('resolveTransactionCategory', () => {
  it('prefers Plaid PFC over descriptor rules', () => {
    expect(
      resolveTransactionCategory({
        descriptionRaw: 'Starbucks',
        sourcePayload: { category: 'FOOD_AND_DRINK' },
      }),
    ).toBe('food')
  })

  it('falls back to descriptor rules when Plaid category is absent', () => {
    expect(
      resolveTransactionCategory({
        descriptionRaw: 'NETFLIX INDIA',
        sourcePayload: {},
      }),
    ).toBe('subscriptions')
  })
})
