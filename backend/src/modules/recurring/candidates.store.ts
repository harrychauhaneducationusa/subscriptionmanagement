import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'
import {
  createSubscription,
  createUtilityBill,
  listRecurringItems,
  type OwnershipScope,
  type SubscriptionCadence,
  type UtilityCadence,
} from './recurring.store.js'

export type CandidateType = 'subscription' | 'utility' | 'other_recurring'
export type CandidateReviewStatus =
  | 'pending_review'
  | 'confirmed'
  | 'dismissed'
  | 'merged'
  | 'expired'

export type RecurringCandidate = {
  id: string
  householdId: string
  merchantProfileId: string | null
  candidateType: CandidateType
  displayName: string
  category: string
  confidenceScore: number
  reasonCodes: string[]
  suggestedAmount: number
  cadence: string
  ownershipScope: OwnershipScope
  suggestedNextOccurrenceAt: string | null
  reviewStatus: CandidateReviewStatus
  sourceTransactionRefs: string[]
  mergedTargetKind: 'subscription' | 'utility' | null
  mergedTargetId: string | null
  createdAt: string
  updatedAt: string
}

type NormalizedTransactionForDetectionRow = QueryResultRow & {
  normalized_transaction_id: string
  household_id: string
  raw_transaction_id: string
  merchant_profile_id: string | null
  description_normalized: string
  category: string
  amount: string | number
  recurring_signals: { cadence_hint?: string } | null
  occurred_at: string | Date
  display_name: string | null
  merchant_type: string | null
}

type CandidateRow = QueryResultRow & {
  id: string
  household_id: string
  merchant_profile_id: string | null
  candidate_type: CandidateType
  display_name: string
  category: string
  confidence_score: string | number
  reason_codes: string[]
  suggested_amount: string | number
  cadence: string
  ownership_scope: OwnershipScope
  suggested_next_occurrence_at: string | Date | null
  review_status: CandidateReviewStatus
  source_transaction_refs: string[]
  merged_target_kind: 'subscription' | 'utility' | null
  merged_target_id: string | null
  created_at: string | Date
  updated_at: string | Date
}

const candidates = new Map<string, RecurringCandidate>()

export async function generateCandidatesFromNormalizedTransactions(normalizedTransactionIds: string[]) {
  if (normalizedTransactionIds.length === 0) {
    return []
  }

  const pool = getDatabasePool()

  if (!pool) {
    return []
  }

  const result = await pool.query<NormalizedTransactionForDetectionRow>(
    `
      select
        nt.id as normalized_transaction_id,
        nt.household_id,
        nt.raw_transaction_id,
        nt.merchant_profile_id,
        nt.description_normalized,
        nt.category,
        nt.amount,
        nt.recurring_signals,
        rt.occurred_at,
        mp.display_name,
        mp.merchant_type
      from normalized_transactions nt
      join raw_transactions rt on rt.id = nt.raw_transaction_id
      left join merchant_profiles mp on mp.id = nt.merchant_profile_id
      where nt.id = any($1::varchar[])
    `,
    [normalizedTransactionIds],
  )

  const createdCandidates: RecurringCandidate[] = []

  for (const row of result.rows) {
    const recurringSignals = row.recurring_signals ?? {}
    const cadenceHint = recurringSignals.cadence_hint ?? 'unknown'
    const candidateType = inferCandidateType(row.merchant_type, row.category)

    if (candidateType === 'other_recurring' || cadenceHint === 'unknown') {
      continue
    }

    const alreadyExists = await candidateExists(row.household_id, row.merchant_profile_id, candidateType)

    if (alreadyExists) {
      continue
    }

    const candidate: RecurringCandidate = {
      id: `rc_${randomUUID()}`,
      householdId: row.household_id,
      merchantProfileId: row.merchant_profile_id,
      candidateType,
      displayName: row.display_name ?? titleCase(row.description_normalized),
      category: row.category,
      confidenceScore: candidateType === 'utility' ? 0.86 : 0.8,
      reasonCodes: [
        `merchant_type_${row.merchant_type ?? 'unknown'}`,
        `cadence_hint_${cadenceHint}`,
        'linked_account_transaction',
      ],
      suggestedAmount: toNumber(row.amount),
      cadence: cadenceHint,
      ownershipScope: candidateType === 'utility' ? 'shared' : 'personal',
      suggestedNextOccurrenceAt: new Date(
        new Date(row.occurred_at).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      reviewStatus: 'pending_review',
      sourceTransactionRefs: [row.raw_transaction_id, row.normalized_transaction_id],
      mergedTargetKind: null,
      mergedTargetId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await pool.query(
      `
        insert into recurring_candidates (
          id,
          household_id,
          merchant_profile_id,
          candidate_type,
          display_name,
          category,
          confidence_score,
          reason_codes,
          suggested_amount,
          cadence,
          ownership_scope,
          suggested_next_occurrence_at,
          review_status,
          source_transaction_refs,
          merged_target_kind,
          merged_target_id,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18)
      `,
      [
        candidate.id,
        candidate.householdId,
        candidate.merchantProfileId,
        candidate.candidateType,
        candidate.displayName,
        candidate.category,
        candidate.confidenceScore,
        JSON.stringify(candidate.reasonCodes),
        candidate.suggestedAmount,
        candidate.cadence,
        candidate.ownershipScope,
        candidate.suggestedNextOccurrenceAt,
        candidate.reviewStatus,
        JSON.stringify(candidate.sourceTransactionRefs),
        candidate.mergedTargetKind,
        candidate.mergedTargetId,
        candidate.createdAt,
        candidate.updatedAt,
      ],
    )

    createdCandidates.push(candidate)
  }

  return createdCandidates
}

export async function listRecurringCandidates(
  householdId: string,
  filters?: {
    reviewStatus?: CandidateReviewStatus
    candidateType?: CandidateType
    confidenceMin?: number
    ownershipScope?: OwnershipScope
  },
) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...candidates.values()].filter((candidate) => {
      return (
        candidate.householdId === householdId &&
        (filters?.reviewStatus ? candidate.reviewStatus === filters.reviewStatus : true) &&
        (filters?.candidateType ? candidate.candidateType === filters.candidateType : true) &&
        (filters?.confidenceMin ? candidate.confidenceScore >= filters.confidenceMin : true) &&
        (filters?.ownershipScope ? candidate.ownershipScope === filters.ownershipScope : true)
      )
    })
  }

  const conditions = ['household_id = $1']
  const values: Array<string | number> = [householdId]

  if (filters?.reviewStatus) {
    values.push(filters.reviewStatus)
    conditions.push(`review_status = $${values.length}`)
  } else {
    values.push('pending_review')
    conditions.push(`review_status = $${values.length}`)
  }

  if (filters?.candidateType) {
    values.push(filters.candidateType)
    conditions.push(`candidate_type = $${values.length}`)
  }

  if (filters?.confidenceMin !== undefined) {
    values.push(filters.confidenceMin)
    conditions.push(`confidence_score >= $${values.length}`)
  }

  if (filters?.ownershipScope) {
    values.push(filters.ownershipScope)
    conditions.push(`ownership_scope = $${values.length}`)
  }

  const result = await pool.query<CandidateRow>(
    `
      select *
      from recurring_candidates
      where ${conditions.join(' and ')}
      order by confidence_score desc, created_at desc
    `,
    values,
  )

  return result.rows.map(mapCandidateRow)
}

export async function updateRecurringCandidate(
  householdId: string,
  candidateId: string,
  update: Partial<
    Pick<
      RecurringCandidate,
      | 'displayName'
      | 'candidateType'
      | 'category'
      | 'suggestedAmount'
      | 'cadence'
      | 'ownershipScope'
      | 'suggestedNextOccurrenceAt'
    >
  >,
) {
  const candidate = await getRecurringCandidate(householdId, candidateId)

  if (!candidate) {
    return null
  }

  const nextCandidate: RecurringCandidate = {
    ...candidate,
    ...update,
    updatedAt: new Date().toISOString(),
  }

  return persistCandidate(nextCandidate)
}

export async function dismissRecurringCandidate(householdId: string, candidateId: string) {
  const candidate = await getRecurringCandidate(householdId, candidateId)

  if (!candidate) {
    return null
  }

  return persistCandidate({
    ...candidate,
    reviewStatus: 'dismissed',
    updatedAt: new Date().toISOString(),
  })
}

export async function confirmRecurringCandidate(
  householdId: string,
  candidateId: string,
  input: {
    createdBy: string
  },
) {
  const candidate = await getRecurringCandidate(householdId, candidateId)

  if (!candidate) {
    return null
  }

  let recurringItem: { kind: 'subscription' | 'utility'; id: string } | null = null

  if (candidate.candidateType === 'utility') {
    const utilityBill = await createUtilityBill({
      householdId,
      providerName: candidate.displayName,
      category: candidate.category,
      typicalAmount: candidate.suggestedAmount,
      cadence: mapUtilityCadence(candidate.cadence),
      nextDueAt: candidate.suggestedNextOccurrenceAt,
      ownershipScope: candidate.ownershipScope,
      createdBy: input.createdBy,
      sourceType: 'detected',
    })

    recurringItem = {
      kind: 'utility',
      id: utilityBill.id,
    }
  } else {
    const subscription = await createSubscription({
      householdId,
      name: candidate.displayName,
      providerName: candidate.displayName,
      category: candidate.category,
      amount: candidate.suggestedAmount,
      cadence: mapSubscriptionCadence(candidate.cadence),
      nextRenewalAt: candidate.suggestedNextOccurrenceAt,
      ownershipScope: candidate.ownershipScope,
      createdBy: input.createdBy,
      sourceType: 'detected',
    })

    recurringItem = {
      kind: 'subscription',
      id: subscription.id,
    }
  }

  const nextCandidate = await persistCandidate({
    ...candidate,
    reviewStatus: 'confirmed',
    mergedTargetKind: recurringItem.kind,
    mergedTargetId: recurringItem.id,
    updatedAt: new Date().toISOString(),
  })

  return {
    candidate: nextCandidate,
    recurringItem,
  }
}

export async function mergeRecurringCandidate(
  householdId: string,
  candidateId: string,
  input: {
    targetRecurringId: string
  },
) {
  const candidate = await getRecurringCandidate(householdId, candidateId)

  if (!candidate) {
    return null
  }

  const recurringItems = await listRecurringItems(householdId)
  const target = recurringItems.find((item) => item.id === input.targetRecurringId)

  if (!target) {
    return null
  }

  const nextCandidate = await persistCandidate({
    ...candidate,
    reviewStatus: 'merged',
    mergedTargetKind: target.kind,
    mergedTargetId: target.id,
    updatedAt: new Date().toISOString(),
  })

  return {
    candidate: nextCandidate,
    mergedInto: {
      kind: target.kind,
      id: target.id,
      title: target.title,
    },
  }
}

async function candidateExists(
  householdId: string,
  merchantProfileId: string | null,
  candidateType: CandidateType,
) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...candidates.values()].some(
      (candidate) =>
        candidate.householdId === householdId &&
        candidate.merchantProfileId === merchantProfileId &&
        candidate.candidateType === candidateType &&
        ['pending_review', 'confirmed', 'merged'].includes(candidate.reviewStatus),
    )
  }

  if (!merchantProfileId) {
    return false
  }

  const result = await pool.query(
    `
      select 1
      from recurring_candidates
      where household_id = $1
        and merchant_profile_id = $2
        and candidate_type = $3
        and review_status = any($4::varchar[])
      limit 1
    `,
    [householdId, merchantProfileId, candidateType, ['pending_review', 'confirmed', 'merged']],
  )

  return result.rows.length > 0
}

async function getRecurringCandidate(householdId: string, candidateId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const candidate = candidates.get(candidateId)
    return candidate?.householdId === householdId ? candidate : null
  }

  const result = await pool.query<CandidateRow>(
    `
      select *
      from recurring_candidates
      where id = $1 and household_id = $2
      limit 1
    `,
    [candidateId, householdId],
  )

  const row = result.rows[0]
  return row ? mapCandidateRow(row) : null
}

async function persistCandidate(candidate: RecurringCandidate) {
  const pool = getDatabasePool()

  if (!pool) {
    candidates.set(candidate.id, candidate)
    return candidate
  }

  await pool.query(
    `
      update recurring_candidates
      set
        candidate_type = $3,
        display_name = $4,
        category = $5,
        confidence_score = $6,
        reason_codes = $7::jsonb,
        suggested_amount = $8,
        cadence = $9,
        ownership_scope = $10,
        suggested_next_occurrence_at = $11,
        review_status = $12,
        source_transaction_refs = $13::jsonb,
        merged_target_kind = $14,
        merged_target_id = $15,
        updated_at = $16
      where id = $1 and household_id = $2
    `,
    [
      candidate.id,
      candidate.householdId,
      candidate.candidateType,
      candidate.displayName,
      candidate.category,
      candidate.confidenceScore,
      JSON.stringify(candidate.reasonCodes),
      candidate.suggestedAmount,
      candidate.cadence,
      candidate.ownershipScope,
      candidate.suggestedNextOccurrenceAt,
      candidate.reviewStatus,
      JSON.stringify(candidate.sourceTransactionRefs),
      candidate.mergedTargetKind,
      candidate.mergedTargetId,
      candidate.updatedAt,
    ],
  )

  return candidate
}

function mapCandidateRow(row: CandidateRow): RecurringCandidate {
  return {
    id: row.id,
    householdId: row.household_id,
    merchantProfileId: row.merchant_profile_id,
    candidateType: row.candidate_type,
    displayName: row.display_name,
    category: row.category,
    confidenceScore: toNumber(row.confidence_score),
    reasonCodes: row.reason_codes ?? [],
    suggestedAmount: toNumber(row.suggested_amount),
    cadence: row.cadence,
    ownershipScope: row.ownership_scope,
    suggestedNextOccurrenceAt: row.suggested_next_occurrence_at
      ? new Date(row.suggested_next_occurrence_at).toISOString()
      : null,
    reviewStatus: row.review_status,
    sourceTransactionRefs: row.source_transaction_refs ?? [],
    mergedTargetKind: row.merged_target_kind,
    mergedTargetId: row.merged_target_id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function inferCandidateType(merchantType: string | null, category: string): CandidateType {
  if (merchantType === 'utility' || category === 'utilities' || category === 'internet') {
    return 'utility'
  }

  if (merchantType === 'subscription' || category === 'subscriptions') {
    return 'subscription'
  }

  return 'other_recurring'
}

function mapSubscriptionCadence(cadence: string): SubscriptionCadence {
  if (cadence === 'quarterly' || cadence === 'yearly') {
    return cadence
  }

  return 'monthly'
}

function mapUtilityCadence(cadence: string): UtilityCadence {
  if (cadence === 'bi_monthly' || cadence === 'quarterly') {
    return cadence
  }

  return 'monthly'
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value)
}
