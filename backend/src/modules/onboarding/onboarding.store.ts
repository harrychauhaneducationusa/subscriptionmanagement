import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'

export type OnboardingDraft = {
  draftId: string
  householdMode: 'individual' | 'household' | null
  householdType: 'individual' | 'couple' | 'family' | 'shared_household' | null
  essentialRecurringItems: string[]
  seededSubscriptions: string[]
  lastUpdatedAt: string
}

type OnboardingDraftRow = QueryResultRow & {
  id: string
  household_mode: OnboardingDraft['householdMode']
  household_type: OnboardingDraft['householdType']
  essential_recurring_items: string[]
  seeded_subscriptions: string[]
  updated_at: string | Date
}

const defaultDraftId = 'draft_initial'

let onboardingDraft: OnboardingDraft = {
  draftId: defaultDraftId,
  householdMode: null,
  householdType: null,
  essentialRecurringItems: [],
  seededSubscriptions: [],
  lastUpdatedAt: new Date().toISOString(),
}

export async function getOnboardingDraft() {
  const pool = getDatabasePool()

  if (!pool) {
    return onboardingDraft
  }

  const result = await pool.query<OnboardingDraftRow>(
    `
      select id, household_mode, household_type, essential_recurring_items, seeded_subscriptions, updated_at
      from onboarding_drafts
      where id = $1
      limit 1
    `,
    [defaultDraftId],
  )

  const row = result.rows[0]

  if (!row) {
    await pool.query(
      `
        insert into onboarding_drafts (
          id,
          household_mode,
          household_type,
          essential_recurring_items,
          seeded_subscriptions,
          created_at,
          updated_at
        )
        values ($1, null, null, '[]'::jsonb, '[]'::jsonb, current_timestamp, current_timestamp)
      `,
      [defaultDraftId],
    )

    return onboardingDraft
  }

  return mapDraftRow(row)
}

export async function updateOnboardingDraft(update: Partial<OnboardingDraft>) {
  const nextDraft = {
    ...onboardingDraft,
    ...update,
    lastUpdatedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    onboardingDraft = nextDraft
    return onboardingDraft
  }

  await pool.query(
    `
      insert into onboarding_drafts (
        id,
        household_mode,
        household_type,
        essential_recurring_items,
        seeded_subscriptions,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb, current_timestamp, $6)
      on conflict (id)
      do update set
        household_mode = excluded.household_mode,
        household_type = excluded.household_type,
        essential_recurring_items = excluded.essential_recurring_items,
        seeded_subscriptions = excluded.seeded_subscriptions,
        updated_at = excluded.updated_at
    `,
    [
      defaultDraftId,
      nextDraft.householdMode,
      nextDraft.householdType,
      JSON.stringify(nextDraft.essentialRecurringItems),
      JSON.stringify(nextDraft.seededSubscriptions),
      nextDraft.lastUpdatedAt,
    ],
  )

  onboardingDraft = nextDraft
  return onboardingDraft
}

function mapDraftRow(row: OnboardingDraftRow): OnboardingDraft {
  const draft = {
    draftId: row.id,
    householdMode: row.household_mode,
    householdType: row.household_type,
    essentialRecurringItems: row.essential_recurring_items ?? [],
    seededSubscriptions: row.seeded_subscriptions ?? [],
    lastUpdatedAt: new Date(row.updated_at).toISOString(),
  }

  onboardingDraft = draft
  return draft
}
