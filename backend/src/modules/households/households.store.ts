import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'

export type Household = {
  id: string
  name: string
  type: 'individual' | 'couple' | 'family' | 'shared_household'
  ownerUserId: string
  privacyMode: 'balanced' | 'private_first'
  selectedAt: string
}

type HouseholdRow = QueryResultRow & {
  id: string
  name: string
  type: Household['type']
  owner_user_id: string
  privacy_mode: Household['privacyMode']
  selected_at: string | Date
}

type HouseholdMembershipRow = QueryResultRow & {
  role: string
  visibility_scope: string
}

const households = new Map<string, Household>()

export async function createHousehold(input: {
  name: string
  type: Household['type']
  ownerUserId: string
  privacyMode?: Household['privacyMode']
}) {
  const household: Household = {
    id: `hh_${randomUUID()}`,
    name: input.name,
    type: input.type,
    ownerUserId: input.ownerUserId,
    privacyMode: input.privacyMode ?? 'balanced',
    selectedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    households.set(household.id, household)
    return household
  }

  await pool.query('begin')

  try {
    await pool.query(
      `
        insert into households (
          id,
          name,
          type,
          owner_user_id,
          privacy_mode,
          selected_at,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $6, $6)
      `,
      [
        household.id,
        household.name,
        household.type,
        household.ownerUserId,
        household.privacyMode,
        household.selectedAt,
      ],
    )

    await pool.query(
      `
        insert into household_members (
          household_id,
          user_id,
          role,
          member_status,
          visibility_scope,
          created_at
        )
        values ($1, $2, 'owner', 'active', 'full', $3)
      `,
      [household.id, household.ownerUserId, household.selectedAt],
    )

    await pool.query('commit')
    return household
  } catch (error) {
    await pool.query('rollback')
    throw error
  }
}

export async function getHousehold(householdId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return households.get(householdId) ?? null
  }

  const result = await pool.query<HouseholdRow>(
    `
      select id, name, type, owner_user_id, privacy_mode, selected_at
      from households
      where id = $1
      limit 1
    `,
    [householdId],
  )

  const row = result.rows[0]
  return row ? mapHouseholdRow(row) : null
}

export async function getHouseholdMembership(householdId: string, userId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const household = households.get(householdId)

    if (!household || household.ownerUserId !== userId) {
      return null
    }

    return {
      role: 'owner',
      visibilityScope: 'full',
    }
  }

  const result = await pool.query<HouseholdMembershipRow>(
    `
      select role, visibility_scope
      from household_members
      where household_id = $1 and user_id = $2 and member_status = 'active'
      limit 1
    `,
    [householdId, userId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  return {
    role: row.role,
    visibilityScope: row.visibility_scope,
  }
}

function mapHouseholdRow(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    ownerUserId: row.owner_user_id,
    privacyMode: row.privacy_mode,
    selectedAt: new Date(row.selected_at).toISOString(),
  }
}
