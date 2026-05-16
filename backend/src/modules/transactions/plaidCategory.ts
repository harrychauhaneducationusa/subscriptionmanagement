/**
 * Maps Plaid personal_finance_category.primary values to SubSense normalized categories.
 * @see https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
 */
const PLAID_PRIMARY_TO_CATEGORY: Record<string, string> = {
  INCOME: 'income',
  TRANSFER_IN: 'transfers',
  TRANSFER_OUT: 'transfers',
  LOAN_PAYMENTS: 'loan_payments',
  BANK_FEES: 'fees',
  ENTERTAINMENT: 'entertainment',
  FOOD_AND_DRINK: 'food',
  GENERAL_MERCHANDISE: 'shopping',
  HOME_IMPROVEMENT: 'home',
  MEDICAL: 'healthcare',
  PERSONAL_CARE: 'personal',
  GENERAL_SERVICES: 'services',
  GOVERNMENT_AND_NON_PROFIT: 'government',
  TRANSPORTATION: 'transportation',
  TRAVEL: 'travel',
  RENT_AND_UTILITIES: 'utilities',
  UTILITIES: 'utilities',
  SUBSCRIPTIONS: 'subscriptions',
  GAS_STATIONS: 'transportation',
  GROCERIES: 'food',
  TAXI: 'transportation',
  PARKING: 'transportation',
  PUBLIC_TRANSIT: 'transportation',
  RIDE_SHARE: 'transportation',
  FAST_FOOD: 'food',
  COFFEE: 'food',
  RESTAURANTS: 'food',
  ALCOHOL_AND_BARS: 'food',
  AIRLINES: 'travel',
  LODGING: 'travel',
  RENT: 'housing',
  MORTGAGE: 'housing',
  INSURANCE: 'insurance',
  INVESTMENTS: 'investments',
  PAYROLL: 'income',
  REFUNDS: 'income',
  INTEREST: 'income',
  DIVIDENDS: 'income',
}

export function mapPlaidPersonalFinanceCategory(plaidPrimary: string | null | undefined): string | null {
  if (!plaidPrimary) {
    return null
  }

  const normalized = plaidPrimary.trim().toUpperCase()

  return PLAID_PRIMARY_TO_CATEGORY[normalized] ?? null
}

export type RawTransactionSourcePayload = {
  category?: string | null
  merchant_name?: string | null
  plaid_transaction_id?: string | null
}

export function resolveTransactionCategory(input: {
  descriptionRaw: string
  sourcePayload: RawTransactionSourcePayload | null | undefined
}): string {
  const plaidCategory = mapPlaidPersonalFinanceCategory(input.sourcePayload?.category)

  if (plaidCategory) {
    return plaidCategory
  }

  return inferCategoryFromDescriptor(input.descriptionRaw)
}

export function inferCategoryFromDescriptor(descriptor: string) {
  const normalized = descriptor.toLowerCase()

  if (normalized.includes('netflix') || normalized.includes('spotify')) {
    return 'subscriptions'
  }

  if (normalized.includes('power')) {
    return 'utilities'
  }

  if (normalized.includes('fiber') || normalized.includes('broadband') || normalized.includes('internet')) {
    return 'internet'
  }

  return 'other'
}

export function inferMerchantTypeFromCategory(category: string): string {
  if (category === 'utilities' || category === 'internet' || category === 'housing') {
    return 'utility'
  }

  if (category === 'subscriptions' || category === 'entertainment') {
    return 'subscription'
  }

  return 'other'
}

export function recurringSignalSourceForCategory(
  sourcePayload: RawTransactionSourcePayload | null | undefined,
): 'plaid_pfc' | 'descriptor_rules' {
  return sourcePayload?.category ? 'plaid_pfc' : 'descriptor_rules'
}
