/**
 * Dev helper: insert two active subscriptions that satisfy deterministic recommendation rules
 * (per-item downgrade >= 250/mo normalized, plus bundle when 2+ subs and total >= 400).
 * Category "streaming" matches the manual substitution inventory for curated alternatives on the dashboard.
 *
 * Usage (from repo root, with .env containing DATABASE_URL):
 *   npm run seed:recommendation-demo -w backend -- --email=you@example.com
 *   npm run seed:recommendation-demo -w backend -- --household=hh_... --user=usr_...
 *
 * Options:
 *   --email=           Resolve household via users.default_household_id or household_members.
 *   --household=       Target household directly (still need --email or --user for created_by FK).
 *   --user=            User id for subscriptions.created_by (required if --household without --email).
 *   --reset-recs       DELETE recommendations + recommendation-linked insight_events for the household
 *                      so the next dashboard refresh recreates them as "open" (use after dismiss/snooze).
 */

import { randomUUID } from 'node:crypto'
import pg from 'pg'

const DEMO_PROVIDER_MARK = '__SUBSENSE_DEMO_REC__'

function parseArgs(argv) {
  const out = {
    email: null,
    household: null,
    userId: null,
    resetRecs: false,
  }
  for (const raw of argv) {
    if (raw === '--reset-recs') {
      out.resetRecs = true
      continue
    }
    if (raw.startsWith('--email=')) {
      out.email = raw.slice('--email='.length).trim()
      continue
    }
    if (raw.startsWith('--household=')) {
      out.household = raw.slice('--household='.length).trim()
      continue
    }
    if (raw.startsWith('--user=')) {
      out.userId = raw.slice('--user='.length).trim()
      continue
    }
  }
  return out
}

async function resolveHouseholdAndUser(client, { email, household, userId }) {
  if (household && userId) {
    return { householdId: household, userId }
  }

  if (!email) {
    throw new Error('Provide --email=... or both --household=... and --user=...')
  }

  const userRes = await client.query(
    `
      select id, default_household_id
      from users
      where email is not null and lower(trim(email)) = lower(trim($1))
      limit 1
    `,
    [email],
  )
  const userRow = userRes.rows[0]
  if (!userRow) {
    throw new Error(`No user found for email: ${email}`)
  }

  let householdId = household ?? userRow.default_household_id
  if (!householdId) {
    const memberRes = await client.query(
      `
        select household_id
        from household_members
        where user_id = $1
        order by created_at nulls last, household_id
        limit 1
      `,
      [userRow.id],
    )
    householdId = memberRes.rows[0]?.household_id ?? null
  }

  if (!householdId) {
    throw new Error(
      `User ${userRow.id} has no default_household_id and no household_members row; complete onboarding or pass --household=`,
    )
  }

  return { householdId, userId: userId ?? userRow.id }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set (use npm script with --env-file=../.env)')
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const { householdId, userId } = await resolveHouseholdAndUser(client, args)
    console.log(`Target household: ${householdId}, created_by user: ${userId}`)

    if (args.resetRecs) {
      await client.query(`delete from insight_events where household_id = $1 and source_recommendation_id is not null`, [
        householdId,
      ])
      const delRec = await client.query(`delete from recommendations where household_id = $1`, [householdId])
      console.log(`Reset recommendations: removed ${delRec.rowCount} row(s).`)
    }

    const delDemo = await client.query(
      `delete from subscriptions where household_id = $1 and provider_name like $2`,
      [householdId, `${DEMO_PROVIDER_MARK}%`],
    )
    console.log(`Removed prior demo seed subscriptions: ${delDemo.rowCount}`)

    const now = new Date().toISOString()
    const rows = [
      {
        id: `sub_${randomUUID()}`,
        name: 'Demo streaming (Netflix-style)',
        provider: `${DEMO_PROVIDER_MARK}_netflix`,
        amount: 649,
      },
      {
        id: `sub_${randomUUID()}`,
        name: 'Demo streaming (Spotify-style)',
        provider: `${DEMO_PROVIDER_MARK}_spotify`,
        amount: 649,
      },
    ]

    for (const row of rows) {
      await client.query(
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
          values ($1, $2, $3, $4, $5, $6, $7, $8, null, $9, $10, $11, $12, $13, $14)
        `,
        [
          row.id,
          householdId,
          row.name,
          row.provider,
          'streaming',
          row.amount,
          'monthly',
          row.amount,
          'personal',
          'manual',
          'active',
          userId,
          now,
          now,
        ],
      )
      console.log(`Inserted subscription ${row.id} (${row.provider}, Rs ${row.amount}/mo)`)
    }

    console.log('\nDone. Reload /app/dashboard — expect open downgrade recs per item plus bundle; streaming category shows curated alternatives.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
