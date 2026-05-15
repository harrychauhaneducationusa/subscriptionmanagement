import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'
import { listRecurringCandidates } from '../recurring/candidates.store.js'
import { listRecurringItems, type RecurringListItem } from '../recurring/recurring.store.js'

export type RecommendationType = 'cancel' | 'downgrade' | 'share' | 'bundle' | 'monitor'
export type RecommendationTargetEntityType = 'subscription' | 'utility_bill' | 'household_bundle'
export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'snoozed' | 'expired'
export type RecommendationAction = 'accept' | 'dismiss' | 'snooze'

export type Recommendation = {
  id: string
  householdId: string
  recommendationType: RecommendationType
  targetEntityType: RecommendationTargetEntityType
  targetEntityId: string
  title: string
  message: string
  estimatedMonthlyValue: number
  confidence: number
  assumptions: string[]
  priorityRank: number
  status: RecommendationStatus
  actionedAt: string | null
  actionedBy: string | null
  snoozedUntil: string | null
  createdAt: string
  updatedAt: string
}

export type InsightEvent = {
  id: string
  householdId: string
  insightType: string
  sourceRecommendationId: string | null
  generatedText: string
  evidenceRefs: string[]
  freshnessStatus: string
  confidenceLabel: string | null
  generationMode: 'rules' | 'template' | 'ai_grounded'
  createdAt: string
  updatedAt: string
}

export type DashboardInsightSummary = {
  totalMonthlyRecurring: number
  activeItemCount: number
  categoriesTracked: number
  byCategory: Array<{
    category: string
    monthlyAmount: number
    itemCount: number
  }>
  upcomingRenewals: Array<{
    id: string
    kind: 'subscription' | 'utility'
    title: string
    amount: number
    nextOccurrenceAt: string | null
    ownershipScope: 'personal' | 'shared'
  }>
  sourceMix: {
    manualCount: number
    linkedCount: number
  }
  pendingCandidateCount: number
  openRecommendationCount: number
  duplicateIndicators: Array<{
    groupKey: string
    title: string
    itemCount: number
  }>
  topActions: Array<{
    id: string
    label: string
    count: number
    tone: 'info' | 'warning' | 'success'
  }>
}

type RecommendationRow = QueryResultRow & {
  id: string
  household_id: string
  recommendation_type: RecommendationType
  target_entity_type: RecommendationTargetEntityType
  target_entity_id: string
  title: string
  message: string
  estimated_monthly_value: string | number
  confidence: string | number
  assumptions: string[]
  priority_rank: number
  status: RecommendationStatus
  actioned_at: string | Date | null
  actioned_by: string | null
  snoozed_until: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

type InsightEventRow = QueryResultRow & {
  id: string
  household_id: string
  insight_type: string
  source_recommendation_id: string | null
  generated_text: string
  evidence_refs: string[]
  freshness_status: string
  confidence_label: string | null
  generation_mode: 'rules' | 'template' | 'ai_grounded'
  created_at: string | Date
  updated_at: string | Date
}

type RecommendationDraft = Omit<
  Recommendation,
  'status' | 'actionedAt' | 'actionedBy' | 'snoozedUntil' | 'createdAt' | 'updatedAt' | 'priorityRank'
>

const recommendationStore = new Map<string, Recommendation>()
const insightEventStore = new Map<string, InsightEvent>()

export async function getDashboardInsightData(householdId: string) {
  const activeItems = (await listRecurringItems(householdId)).filter((item) => item.status === 'active')
  const pendingCandidates = await listRecurringCandidates(householdId, {
    reviewStatus: 'pending_review',
  })
  const recommendations = await refreshRecommendationsForHousehold(householdId, activeItems)
  const openRecommendations = recommendations.filter((recommendation) => recommendation.status === 'open')
  const summary = buildSummary(activeItems, pendingCandidates.length, openRecommendations.length)
  const feed = await refreshInsightFeedForHousehold(householdId, summary, openRecommendations)

  return {
    summary,
    recommendations: openRecommendations,
    feed,
    freshness: buildFreshness(summary),
  }
}

export async function listHouseholdRecommendations(householdId: string) {
  const data = await getDashboardInsightData(householdId)
  return data.recommendations
}

export async function listHouseholdInsightFeed(householdId: string) {
  const data = await getDashboardInsightData(householdId)
  return data.feed
}

export async function applyRecommendationAction(
  householdId: string,
  recommendationId: string,
  input: {
    action: RecommendationAction
    actorId: string
    snoozeDays?: number
  },
) {
  const recommendation = await getRecommendation(householdId, recommendationId)

  if (!recommendation) {
    return null
  }

  const now = new Date()
  const nextRecommendation: Recommendation = {
    ...recommendation,
    status:
      input.action === 'accept'
        ? 'accepted'
        : input.action === 'dismiss'
          ? 'dismissed'
          : 'snoozed',
    actionedAt: now.toISOString(),
    actionedBy: input.actorId,
    snoozedUntil:
      input.action === 'snooze'
        ? new Date(now.getTime() + (input.snoozeDays ?? 14) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    updatedAt: now.toISOString(),
  }

  await persistRecommendation(nextRecommendation)
  await getDashboardInsightData(householdId)

  return nextRecommendation
}

async function refreshRecommendationsForHousehold(
  householdId: string,
  activeItems: RecurringListItem[],
) {
  const drafts = buildRecommendationDrafts(householdId, activeItems)
  const prioritizedDrafts = drafts
    .sort((left, right) => right.estimatedMonthlyValue - left.estimatedMonthlyValue)
    .slice(0, 5)
  const existingRecommendations = await listRecommendationsFromStorage(householdId)
  const existingById = new Map(existingRecommendations.map((recommendation) => [recommendation.id, recommendation]))
  const nextRecommendations = prioritizedDrafts.map((draft, index) => {
    const existing = existingById.get(draft.id)

    return {
      ...draft,
      priorityRank: index + 1,
      status: resolveExistingStatus(existing),
      actionedAt: existing?.actionedAt ?? null,
      actionedBy: existing?.actionedBy ?? null,
      snoozedUntil: resolveSnoozedUntil(existing),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Recommendation
  })

  for (const recommendation of nextRecommendations) {
    await persistRecommendation(recommendation)
  }

  const nextIds = new Set(nextRecommendations.map((recommendation) => recommendation.id))

  for (const existing of existingRecommendations) {
    if (nextIds.has(existing.id)) {
      continue
    }

    if (existing.status === 'open' || existing.status === 'snoozed') {
      await persistRecommendation({
        ...existing,
        status: 'expired',
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return listRecommendationsFromStorage(householdId)
}

async function refreshInsightFeedForHousehold(
  householdId: string,
  summary: DashboardInsightSummary,
  openRecommendations: Recommendation[],
) {
  const summaryEvent: InsightEvent = {
    id: `ins_summary_${householdId}`,
    householdId,
    insightType: 'dashboard_summary',
    sourceRecommendationId: null,
    generatedText: `Tracking Rs ${summary.totalMonthlyRecurring}/month across ${summary.activeItemCount} active recurring items with ${summary.pendingCandidateCount} candidate${summary.pendingCandidateCount === 1 ? '' : 's'} still waiting for review.`,
    evidenceRefs: [
      `monthly_total:${summary.totalMonthlyRecurring}`,
      `active_items:${summary.activeItemCount}`,
      `pending_candidates:${summary.pendingCandidateCount}`,
    ],
    freshnessStatus: 'fresh',
    confidenceLabel: 'high',
    generationMode: 'rules',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await persistInsightEvent(summaryEvent)

  for (const recommendation of openRecommendations) {
    await persistInsightEvent({
      id: `ie_${recommendation.id}`,
      householdId,
      insightType: 'recommendation_explanation',
      sourceRecommendationId: recommendation.id,
      generatedText: recommendation.message,
      evidenceRefs: [
        `recommendation:${recommendation.recommendationType}`,
        `target:${recommendation.targetEntityId}`,
      ],
      freshnessStatus: 'fresh',
      confidenceLabel: recommendation.confidence >= 0.8 ? 'high' : 'medium',
      generationMode: 'template',
      createdAt: recommendation.createdAt,
      updatedAt: new Date().toISOString(),
    })
  }

  await removeStaleRecommendationInsightEvents(
    householdId,
    openRecommendations.map((recommendation) => recommendation.id),
  )

  return listInsightEventsFromStorage(householdId)
}

function buildSummary(
  activeItems: RecurringListItem[],
  pendingCandidateCount: number,
  openRecommendationCount: number,
): DashboardInsightSummary {
  const totalMonthlyRecurring = activeItems.reduce(
    (sum, item) => sum + item.normalizedMonthlyAmount,
    0,
  )
  const byCategory = Object.entries(
    activeItems.reduce<Record<string, { monthlyAmount: number; itemCount: number }>>((accumulator, item) => {
      const current = accumulator[item.category] ?? {
        monthlyAmount: 0,
        itemCount: 0,
      }

      accumulator[item.category] = {
        monthlyAmount: current.monthlyAmount + item.normalizedMonthlyAmount,
        itemCount: current.itemCount + 1,
      }

      return accumulator
    }, {}),
  )
    .map(([category, value]) => ({
      category,
      monthlyAmount: roundCurrency(value.monthlyAmount),
      itemCount: value.itemCount,
    }))
    .sort((left, right) => right.monthlyAmount - left.monthlyAmount)

  const upcomingRenewals = activeItems
    .filter((item) => item.nextOccurrenceAt)
    .sort((left, right) => {
      const leftTime = left.nextOccurrenceAt ? new Date(left.nextOccurrenceAt).getTime() : Number.MAX_SAFE_INTEGER
      const rightTime = right.nextOccurrenceAt ? new Date(right.nextOccurrenceAt).getTime() : Number.MAX_SAFE_INTEGER
      return leftTime - rightTime
    })
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      amount: item.amount,
      nextOccurrenceAt: item.nextOccurrenceAt,
      ownershipScope: item.ownershipScope,
    }))

  const sourceMix = {
    manualCount: activeItems.filter((item) => item.sourceType === 'manual').length,
    linkedCount: activeItems.filter((item) => item.sourceType !== 'manual').length,
  }

  const duplicateIndicators = Object.values(
    activeItems.reduce<Record<string, { groupKey: string; title: string; itemCount: number }>>(
      (accumulator, item) => {
        const groupKey = `${item.kind}:${item.providerName.trim().toLowerCase()}`
        const current = accumulator[groupKey] ?? {
          groupKey,
          title: item.providerName,
          itemCount: 0,
        }

        accumulator[groupKey] = {
          ...current,
          itemCount: current.itemCount + 1,
        }

        return accumulator
      },
      {},
    ),
  ).filter((group) => group.itemCount > 1)

  const topActions = [
    ...(pendingCandidateCount > 0
      ? [
          {
            id: 'review_candidates',
            label: 'Review detected candidates',
            count: pendingCandidateCount,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(openRecommendationCount > 0
      ? [
          {
            id: 'review_recommendations',
            label: 'Review savings recommendations',
            count: openRecommendationCount,
            tone: 'success' as const,
          },
        ]
      : []),
    ...(sourceMix.linkedCount === 0
      ? [
          {
            id: 'connect_bank_data',
            label: 'Connect bank data',
            count: 1,
            tone: 'info' as const,
          },
        ]
      : []),
  ]

  return {
    totalMonthlyRecurring: roundCurrency(totalMonthlyRecurring),
    activeItemCount: activeItems.length,
    categoriesTracked: byCategory.length,
    byCategory,
    upcomingRenewals,
    sourceMix,
    pendingCandidateCount,
    openRecommendationCount,
    duplicateIndicators,
    topActions,
  }
}

function buildFreshness(summary: DashboardInsightSummary) {
  const sourceLabel =
    summary.sourceMix.linkedCount > 0 && summary.sourceMix.manualCount > 0
      ? 'linked and manual recurring data'
      : summary.sourceMix.linkedCount > 0
        ? 'linked recurring data'
        : summary.activeItemCount > 0
          ? 'tracked recurring items'
          : 'no recurring data yet'

  return {
    status: summary.activeItemCount > 0 || summary.pendingCandidateCount > 0 ? 'fresh' : 'partial',
    last_successful_sync_at: new Date().toISOString(),
    stale_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    message:
      sourceLabel === 'no recurring data yet'
        ? 'Add manual recurring items or connect bank data to unlock the first dashboard insights.'
        : `Updated from ${sourceLabel}.`,
  }
}

function buildRecommendationDrafts(householdId: string, activeItems: RecurringListItem[]): RecommendationDraft[] {
  const drafts: RecommendationDraft[] = []
  const activeSubscriptions = activeItems.filter((item) => item.kind === 'subscription')
  const activeUtilities = activeItems.filter((item) => item.kind === 'utility')

  for (const item of activeSubscriptions) {
    if (item.normalizedMonthlyAmount >= 250) {
      drafts.push({
        id: `rec_downgrade_${item.id}`,
        householdId,
        recommendationType: 'downgrade',
        targetEntityType: 'subscription',
        targetEntityId: item.id,
        title: `Review ${item.title} plan cost`,
        message: `${item.title} is costing about Rs ${item.normalizedMonthlyAmount} each month. Check whether a lower plan tier or annual plan would still cover actual usage.`,
        estimatedMonthlyValue: roundCurrency(Math.max(49, item.normalizedMonthlyAmount * 0.15)),
        confidence: item.sourceType === 'detected' ? 0.84 : 0.74,
        assumptions: [
          'Savings estimate assumes a cheaper valid plan exists for the same service.',
          'Current recurring amount is based on the latest normalized monthly cost.',
        ],
      })
    }

    if (item.ownershipScope === 'personal' && item.normalizedMonthlyAmount >= 150) {
      drafts.push({
        id: `rec_share_${item.id}`,
        householdId,
        recommendationType: 'share',
        targetEntityType: 'subscription',
        targetEntityId: item.id,
        title: `Check whether ${item.title} can be shared`,
        message: `${item.title} is tagged as personal spend. If the service supports family or shared usage, moving it into a shared plan could reduce duplicate household spend.`,
        estimatedMonthlyValue: roundCurrency(Math.max(39, item.normalizedMonthlyAmount * 0.12)),
        confidence: 0.71,
        assumptions: [
          'Savings estimate assumes a family or shared option is available.',
          'Recommendation is strongest when multiple household members use the same service.',
        ],
      })
    }
  }

  for (const item of activeUtilities) {
    if (item.normalizedMonthlyAmount >= 1000) {
      drafts.push({
        id: `rec_monitor_${item.id}`,
        householdId,
        recommendationType: 'monitor',
        targetEntityType: 'utility_bill',
        targetEntityId: item.id,
        title: `Watch the next ${item.title} bill`,
        message: `${item.title} is one of the largest recurring household costs. Keep the next due amount under review for changes before it becomes budget drift.`,
        estimatedMonthlyValue: roundCurrency(Math.max(79, item.normalizedMonthlyAmount * 0.08)),
        confidence: item.sourceType === 'detected' ? 0.81 : 0.7,
        assumptions: [
          'Savings estimate assumes early detection of bill changes prevents avoidable overspend.',
          'Utility monitoring value is based on the current typical monthly amount.',
        ],
      })
    }
  }

  const subscriptionTotal = activeSubscriptions.reduce(
    (sum, item) => sum + item.normalizedMonthlyAmount,
    0,
  )

  if (activeSubscriptions.length >= 2 && subscriptionTotal >= 400) {
    drafts.push({
      id: `rec_bundle_${householdId}`,
      householdId,
      recommendationType: 'bundle',
      targetEntityType: 'household_bundle',
      targetEntityId: 'bundle_subscriptions',
      title: 'Review overlapping subscription spend',
      message: `You have ${activeSubscriptions.length} active subscriptions totaling about Rs ${roundCurrency(subscriptionTotal)} each month. A bundle, annual plan, or one cancellation could reduce overlap.`,
      estimatedMonthlyValue: roundCurrency(Math.max(99, subscriptionTotal * 0.12)),
      confidence: 0.76,
      assumptions: [
        'Savings estimate assumes at least one plan can be bundled, downgraded, or removed.',
        'Household bundle opportunities are strongest when multiple subscriptions are active together.',
      ],
    })
  }

  return drafts
}

async function listRecommendationsFromStorage(householdId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...recommendationStore.values()]
      .filter((recommendation) => recommendation.householdId === householdId)
      .sort(sortRecommendations)
  }

  const result = await pool.query<RecommendationRow>(
    `
      select *
      from recommendations
      where household_id = $1
      order by priority_rank asc, estimated_monthly_value desc, created_at desc
    `,
    [householdId],
  )

  return result.rows.map(mapRecommendationRow)
}

async function getRecommendation(householdId: string, recommendationId: string) {
  const recommendations = await listRecommendationsFromStorage(householdId)
  return recommendations.find((recommendation) => recommendation.id === recommendationId) ?? null
}

async function persistRecommendation(recommendation: Recommendation) {
  const pool = getDatabasePool()

  if (!pool) {
    recommendationStore.set(recommendation.id, recommendation)
    return recommendation
  }

  await pool.query(
    `
      insert into recommendations (
        id,
        household_id,
        recommendation_type,
        target_entity_type,
        target_entity_id,
        title,
        message,
        estimated_monthly_value,
        confidence,
        assumptions,
        priority_rank,
        status,
        actioned_at,
        actioned_by,
        snoozed_until,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17)
      on conflict (id) do update set
        recommendation_type = excluded.recommendation_type,
        target_entity_type = excluded.target_entity_type,
        target_entity_id = excluded.target_entity_id,
        title = excluded.title,
        message = excluded.message,
        estimated_monthly_value = excluded.estimated_monthly_value,
        confidence = excluded.confidence,
        assumptions = excluded.assumptions,
        priority_rank = excluded.priority_rank,
        status = excluded.status,
        actioned_at = excluded.actioned_at,
        actioned_by = excluded.actioned_by,
        snoozed_until = excluded.snoozed_until,
        updated_at = excluded.updated_at
    `,
    [
      recommendation.id,
      recommendation.householdId,
      recommendation.recommendationType,
      recommendation.targetEntityType,
      recommendation.targetEntityId,
      recommendation.title,
      recommendation.message,
      recommendation.estimatedMonthlyValue,
      recommendation.confidence,
      JSON.stringify(recommendation.assumptions),
      recommendation.priorityRank,
      recommendation.status,
      recommendation.actionedAt,
      recommendation.actionedBy,
      recommendation.snoozedUntil,
      recommendation.createdAt,
      recommendation.updatedAt,
    ],
  )

  return recommendation
}

async function listInsightEventsFromStorage(householdId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...insightEventStore.values()]
      .filter((event) => event.householdId === householdId)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }

  const result = await pool.query<InsightEventRow>(
    `
      select *
      from insight_events
      where household_id = $1
      order by updated_at desc
      limit 10
    `,
    [householdId],
  )

  return result.rows.map(mapInsightEventRow)
}

async function persistInsightEvent(event: InsightEvent) {
  const pool = getDatabasePool()

  if (!pool) {
    insightEventStore.set(event.id, event)
    return event
  }

  await pool.query(
    `
      insert into insight_events (
        id,
        household_id,
        insight_type,
        source_recommendation_id,
        generated_text,
        evidence_refs,
        freshness_status,
        confidence_label,
        generation_mode,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
      on conflict (id) do update set
        insight_type = excluded.insight_type,
        source_recommendation_id = excluded.source_recommendation_id,
        generated_text = excluded.generated_text,
        evidence_refs = excluded.evidence_refs,
        freshness_status = excluded.freshness_status,
        confidence_label = excluded.confidence_label,
        generation_mode = excluded.generation_mode,
        updated_at = excluded.updated_at
    `,
    [
      event.id,
      event.householdId,
      event.insightType,
      event.sourceRecommendationId,
      event.generatedText,
      JSON.stringify(event.evidenceRefs),
      event.freshnessStatus,
      event.confidenceLabel,
      event.generationMode,
      event.createdAt,
      event.updatedAt,
    ],
  )

  return event
}

async function removeStaleRecommendationInsightEvents(householdId: string, activeRecommendationIds: string[]) {
  const pool = getDatabasePool()

  if (!pool) {
    for (const [id, event] of insightEventStore.entries()) {
      if (
        event.householdId === householdId &&
        event.sourceRecommendationId &&
        !activeRecommendationIds.includes(event.sourceRecommendationId)
      ) {
        insightEventStore.delete(id)
      }
    }

    return
  }

  if (activeRecommendationIds.length === 0) {
    await pool.query(
      `
        delete from insight_events
        where household_id = $1 and source_recommendation_id is not null
      `,
      [householdId],
    )
    return
  }

  await pool.query(
    `
      delete from insight_events
      where household_id = $1
        and source_recommendation_id is not null
        and not (source_recommendation_id = any($2::varchar[]))
    `,
    [householdId, activeRecommendationIds],
  )
}

function resolveExistingStatus(existing?: Recommendation) {
  if (!existing) {
    return 'open'
  }

  if (existing.status === 'snoozed' && existing.snoozedUntil) {
    return new Date(existing.snoozedUntil).getTime() <= Date.now() ? 'open' : 'snoozed'
  }

  return existing.status
}

function resolveSnoozedUntil(existing?: Recommendation) {
  if (!existing || existing.status !== 'snoozed') {
    return null
  }

  if (!existing.snoozedUntil) {
    return null
  }

  return new Date(existing.snoozedUntil).getTime() <= Date.now() ? null : existing.snoozedUntil
}

function mapRecommendationRow(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    householdId: row.household_id,
    recommendationType: row.recommendation_type,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id,
    title: row.title,
    message: row.message,
    estimatedMonthlyValue: toNumber(row.estimated_monthly_value),
    confidence: toNumber(row.confidence),
    assumptions: row.assumptions ?? [],
    priorityRank: row.priority_rank,
    status: row.status,
    actionedAt: row.actioned_at ? new Date(row.actioned_at).toISOString() : null,
    actionedBy: row.actioned_by,
    snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapInsightEventRow(row: InsightEventRow): InsightEvent {
  return {
    id: row.id,
    householdId: row.household_id,
    insightType: row.insight_type,
    sourceRecommendationId: row.source_recommendation_id,
    generatedText: row.generated_text,
    evidenceRefs: row.evidence_refs ?? [],
    freshnessStatus: row.freshness_status,
    confidenceLabel: row.confidence_label,
    generationMode: row.generation_mode,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function sortRecommendations(left: Recommendation, right: Recommendation) {
  if (left.priorityRank !== right.priorityRank) {
    return left.priorityRank - right.priorityRank
  }

  return right.estimatedMonthlyValue - left.estimatedMonthlyValue
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value)
}
