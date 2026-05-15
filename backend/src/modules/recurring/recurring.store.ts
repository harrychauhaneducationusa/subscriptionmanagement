import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'

export type OwnershipScope = 'personal' | 'shared'
export type RecurringStatus = 'active' | 'paused' | 'cancelled'
export type SubscriptionCadence = 'monthly' | 'quarterly' | 'yearly'
export type UtilityCadence = 'monthly' | 'bi_monthly' | 'quarterly'
export type RecurringSourceType = 'manual' | 'detected' | 'merged'

export type Subscription = {
  id: string
  householdId: string
  name: string
  providerName: string
  category: string
  amount: number
  cadence: SubscriptionCadence
  nextRenewalAt: string | null
  ownershipScope: OwnershipScope
  sourceType: RecurringSourceType
  status: RecurringStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type UtilityBill = {
  id: string
  householdId: string
  providerName: string
  category: string
  typicalAmount: number
  cadence: UtilityCadence
  nextDueAt: string | null
  ownershipScope: OwnershipScope
  sourceType: RecurringSourceType
  status: RecurringStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type RecurringListItem = {
  id: string
  kind: 'subscription' | 'utility'
  title: string
  providerName: string
  category: string
  amount: number
  normalizedMonthlyAmount: number
  cadence: string
  nextOccurrenceAt: string | null
  ownershipScope: OwnershipScope
  sourceType: RecurringSourceType
  status: RecurringStatus
}

type SubscriptionRow = QueryResultRow & {
  id: string
  household_id: string
  name: string
  provider_name: string
  category: string
  amount: string | number
  cadence: SubscriptionCadence
  next_renewal_at: string | Date | null
  ownership_scope: OwnershipScope
  source_type: RecurringSourceType
  status: RecurringStatus
  created_by: string
  created_at: string | Date
  updated_at: string | Date
}

type UtilityBillRow = QueryResultRow & {
  id: string
  household_id: string
  provider_name: string
  category: string
  typical_amount: string | number
  cadence: UtilityCadence
  next_due_at: string | Date | null
  ownership_scope: OwnershipScope
  source_type: RecurringSourceType
  status: RecurringStatus
  created_by: string
  created_at: string | Date
  updated_at: string | Date
}

type RecurringListItemRow = QueryResultRow & {
  id: string
  kind: 'subscription' | 'utility'
  title: string
  provider_name: string
  category: string
  amount: string | number
  normalized_monthly_amount: string | number
  cadence: string
  next_occurrence_at: string | Date | null
  ownership_scope: OwnershipScope
  source_type: RecurringSourceType
  status: RecurringStatus
}

const subscriptions = new Map<string, Subscription>()
const utilityBills = new Map<string, UtilityBill>()

export async function createSubscription(input: {
  householdId: string
  name: string
  providerName: string
  category: string
  amount: number
  cadence: SubscriptionCadence
  nextRenewalAt: string | null
  ownershipScope: OwnershipScope
  createdBy: string
  sourceType?: RecurringSourceType
}) {
  const subscription: Subscription = {
    id: `sub_${randomUUID()}`,
    householdId: input.householdId,
    name: input.name,
    providerName: input.providerName,
    category: input.category,
    amount: input.amount,
    cadence: input.cadence,
    nextRenewalAt: input.nextRenewalAt,
    ownershipScope: input.ownershipScope,
    sourceType: input.sourceType ?? 'manual',
    status: 'active',
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    subscriptions.set(subscription.id, subscription)
    return subscription
  }

  await pool.query(
    `
      insert into subscriptions (
        id,
        household_id,
        name,
        provider_name,
        category,
        amount,
        cadence,
        normalized_monthly_amount,
        next_renewal_at,
        ownership_scope,
        source_type,
        status,
        created_by,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `,
    [
      subscription.id,
      subscription.householdId,
      subscription.name,
      subscription.providerName,
      subscription.category,
      subscription.amount,
      subscription.cadence,
      normalizeMonthlyAmount(subscription.amount, subscription.cadence),
      subscription.nextRenewalAt,
      subscription.ownershipScope,
      subscription.sourceType,
      subscription.status,
      subscription.createdBy,
      subscription.createdAt,
      subscription.updatedAt,
    ],
  )

  return subscription
}

export async function updateSubscription(
  householdId: string,
  subscriptionId: string,
  update: Partial<Pick<Subscription, 'name' | 'providerName' | 'category' | 'amount' | 'cadence' | 'nextRenewalAt' | 'ownershipScope' | 'status'>>,
) {
  const existing = await getSubscription(householdId, subscriptionId)

  if (!existing) {
    return null
  }

  const nextSubscription: Subscription = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    subscriptions.set(subscriptionId, nextSubscription)
    return nextSubscription
  }

  await pool.query(
    `
      update subscriptions
      set
        name = $3,
        provider_name = $4,
        category = $5,
        amount = $6,
        cadence = $7,
        normalized_monthly_amount = $8,
        next_renewal_at = $9,
        ownership_scope = $10,
        status = $11,
        updated_at = $12
      where id = $1 and household_id = $2
    `,
    [
      nextSubscription.id,
      nextSubscription.householdId,
      nextSubscription.name,
      nextSubscription.providerName,
      nextSubscription.category,
      nextSubscription.amount,
      nextSubscription.cadence,
      normalizeMonthlyAmount(nextSubscription.amount, nextSubscription.cadence),
      nextSubscription.nextRenewalAt,
      nextSubscription.ownershipScope,
      nextSubscription.status,
      nextSubscription.updatedAt,
    ],
  )

  return nextSubscription
}

export async function createUtilityBill(input: {
  householdId: string
  providerName: string
  category: string
  typicalAmount: number
  cadence: UtilityCadence
  nextDueAt: string | null
  ownershipScope: OwnershipScope
  createdBy: string
  sourceType?: RecurringSourceType
}) {
  const utilityBill: UtilityBill = {
    id: `utl_${randomUUID()}`,
    householdId: input.householdId,
    providerName: input.providerName,
    category: input.category,
    typicalAmount: input.typicalAmount,
    cadence: input.cadence,
    nextDueAt: input.nextDueAt,
    ownershipScope: input.ownershipScope,
    sourceType: input.sourceType ?? 'manual',
    status: 'active',
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    utilityBills.set(utilityBill.id, utilityBill)
    return utilityBill
  }

  await pool.query(
    `
      insert into utility_bills (
        id,
        household_id,
        provider_name,
        category,
        typical_amount,
        cadence,
        normalized_monthly_amount,
        next_due_at,
        ownership_scope,
        source_type,
        status,
        created_by,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `,
    [
      utilityBill.id,
      utilityBill.householdId,
      utilityBill.providerName,
      utilityBill.category,
      utilityBill.typicalAmount,
      utilityBill.cadence,
      normalizeMonthlyAmount(utilityBill.typicalAmount, utilityBill.cadence),
      utilityBill.nextDueAt,
      utilityBill.ownershipScope,
      utilityBill.sourceType,
      utilityBill.status,
      utilityBill.createdBy,
      utilityBill.createdAt,
      utilityBill.updatedAt,
    ],
  )

  return utilityBill
}

export async function updateUtilityBill(
  householdId: string,
  utilityBillId: string,
  update: Partial<Pick<UtilityBill, 'providerName' | 'category' | 'typicalAmount' | 'cadence' | 'nextDueAt' | 'ownershipScope' | 'status'>>,
) {
  const existing = await getUtilityBill(householdId, utilityBillId)

  if (!existing) {
    return null
  }

  const nextUtilityBill: UtilityBill = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    utilityBills.set(utilityBillId, nextUtilityBill)
    return nextUtilityBill
  }

  await pool.query(
    `
      update utility_bills
      set
        provider_name = $3,
        category = $4,
        typical_amount = $5,
        cadence = $6,
        normalized_monthly_amount = $7,
        next_due_at = $8,
        ownership_scope = $9,
        status = $10,
        updated_at = $11
      where id = $1 and household_id = $2
    `,
    [
      nextUtilityBill.id,
      nextUtilityBill.householdId,
      nextUtilityBill.providerName,
      nextUtilityBill.category,
      nextUtilityBill.typicalAmount,
      nextUtilityBill.cadence,
      normalizeMonthlyAmount(nextUtilityBill.typicalAmount, nextUtilityBill.cadence),
      nextUtilityBill.nextDueAt,
      nextUtilityBill.ownershipScope,
      nextUtilityBill.status,
      nextUtilityBill.updatedAt,
    ],
  )

  return nextUtilityBill
}

export async function listRecurringItems(householdId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const manualSubscriptions = [...subscriptions.values()]
      .filter((item) => item.householdId === householdId)
      .map(mapSubscriptionToListItem)
    const manualUtilities = [...utilityBills.values()]
      .filter((item) => item.householdId === householdId)
      .map(mapUtilityBillToListItem)

    return [...manualSubscriptions, ...manualUtilities].sort(sortByNextOccurrence)
  }

  const result = await pool.query<RecurringListItemRow>(
    `
      select
        id,
        'subscription' as kind,
        name as title,
        provider_name,
        category,
        amount,
        normalized_monthly_amount,
        cadence,
        next_renewal_at as next_occurrence_at,
        ownership_scope,
        source_type,
        status
      from subscriptions
      where household_id = $1
      union all
      select
        id,
        'utility' as kind,
        provider_name as title,
        provider_name,
        category,
        typical_amount as amount,
        normalized_monthly_amount,
        cadence,
        next_due_at as next_occurrence_at,
        ownership_scope,
        source_type,
        status
      from utility_bills
      where household_id = $1
    `,
    [householdId],
  )

  return result.rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    providerName: row.provider_name,
    category: row.category,
    amount: toNumber(row.amount),
    normalizedMonthlyAmount: roundCurrency(toNumber(row.normalized_monthly_amount)),
    cadence: row.cadence,
    nextOccurrenceAt: row.next_occurrence_at ? new Date(row.next_occurrence_at).toISOString() : null,
    ownershipScope: row.ownership_scope,
    sourceType: row.source_type,
    status: row.status,
  })).sort(sortByNextOccurrence)
}

async function getSubscription(householdId: string, subscriptionId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const subscription = subscriptions.get(subscriptionId)
    return subscription?.householdId === householdId ? subscription : null
  }

  const result = await pool.query<SubscriptionRow>(
    `
      select
        id,
        household_id,
        name,
        provider_name,
        category,
        amount,
        cadence,
        next_renewal_at,
        ownership_scope,
        source_type,
        status,
        created_by,
        created_at,
        updated_at
      from subscriptions
      where id = $1 and household_id = $2
      limit 1
    `,
    [subscriptionId, householdId],
  )

  const row = result.rows[0]
  return row ? mapSubscriptionRow(row) : null
}

async function getUtilityBill(householdId: string, utilityBillId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const utilityBill = utilityBills.get(utilityBillId)
    return utilityBill?.householdId === householdId ? utilityBill : null
  }

  const result = await pool.query<UtilityBillRow>(
    `
      select
        id,
        household_id,
        provider_name,
        category,
        typical_amount,
        cadence,
        next_due_at,
        ownership_scope,
        source_type,
        status,
        created_by,
        created_at,
        updated_at
      from utility_bills
      where id = $1 and household_id = $2
      limit 1
    `,
    [utilityBillId, householdId],
  )

  const row = result.rows[0]
  return row ? mapUtilityBillRow(row) : null
}

function mapSubscriptionRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    providerName: row.provider_name,
    category: row.category,
    amount: toNumber(row.amount),
    cadence: row.cadence,
    nextRenewalAt: row.next_renewal_at ? new Date(row.next_renewal_at).toISOString() : null,
    ownershipScope: row.ownership_scope,
    sourceType: row.source_type,
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapUtilityBillRow(row: UtilityBillRow): UtilityBill {
  return {
    id: row.id,
    householdId: row.household_id,
    providerName: row.provider_name,
    category: row.category,
    typicalAmount: toNumber(row.typical_amount),
    cadence: row.cadence,
    nextDueAt: row.next_due_at ? new Date(row.next_due_at).toISOString() : null,
    ownershipScope: row.ownership_scope,
    sourceType: row.source_type,
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapSubscriptionToListItem(subscription: Subscription): RecurringListItem {
  return {
    id: subscription.id,
    kind: 'subscription',
    title: subscription.name,
    providerName: subscription.providerName,
    category: subscription.category,
    amount: subscription.amount,
    normalizedMonthlyAmount: roundCurrency(
      normalizeMonthlyAmount(subscription.amount, subscription.cadence),
    ),
    cadence: subscription.cadence,
    nextOccurrenceAt: subscription.nextRenewalAt,
    ownershipScope: subscription.ownershipScope,
    sourceType: subscription.sourceType,
    status: subscription.status,
  }
}

function mapUtilityBillToListItem(utilityBill: UtilityBill): RecurringListItem {
  return {
    id: utilityBill.id,
    kind: 'utility',
    title: utilityBill.providerName,
    providerName: utilityBill.providerName,
    category: utilityBill.category,
    amount: utilityBill.typicalAmount,
    normalizedMonthlyAmount: roundCurrency(
      normalizeMonthlyAmount(utilityBill.typicalAmount, utilityBill.cadence),
    ),
    cadence: utilityBill.cadence,
    nextOccurrenceAt: utilityBill.nextDueAt,
    ownershipScope: utilityBill.ownershipScope,
    sourceType: utilityBill.sourceType,
    status: utilityBill.status,
  }
}

function normalizeMonthlyAmount(amount: number, cadence: SubscriptionCadence | UtilityCadence) {
  switch (cadence) {
    case 'monthly':
      return amount
    case 'bi_monthly':
      return amount / 2
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

function toNumber(value: number | string) {
  return typeof value === 'number' ? value : Number(value)
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function sortByNextOccurrence(left: RecurringListItem, right: RecurringListItem) {
  const leftTime = left.nextOccurrenceAt ? new Date(left.nextOccurrenceAt).getTime() : Number.MAX_SAFE_INTEGER
  const rightTime = right.nextOccurrenceAt ? new Date(right.nextOccurrenceAt).getTime() : Number.MAX_SAFE_INTEGER
  return leftTime - rightTime
}
