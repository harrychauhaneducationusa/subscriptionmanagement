/**
 * Remove household-scoped product data for users matched by email, and optionally delete those users
 * so the same email can sign up again (dev / fresh QA only).
 *
 * Targets households where the user is the **owner** (`households.owner_user_id`). Clears
 * `users.default_household_id` / `auth_sessions.default_household_id` for any row still pointing
 * at removed households before dropping them.
 *
 * Usage (repo root `.env` with DATABASE_URL):
 *   npm run cleanup:test-users -w backend -- --emails=one@test.com,two@test.com
 *   npm run cleanup:test-users -w backend -- --emails=a@b.com --dry-run
 *   npm run cleanup:test-users -w backend -- --emails=a@b.com --delete-users
 *
 * Default: `--delete-users` is ON (full reset for listed emails). Pass `--keep-users` to only wipe
 * owned household data and sessions, leaving the user row for re-login with an empty default household.
 */

import pg from 'pg'

function parseArgs(argv) {
  const out = {
    emails: [],
    dryRun: false,
    deleteUsers: true,
  }
  for (const raw of argv) {
    if (raw === '--dry-run') {
      out.dryRun = true
      continue
    }
    if (raw === '--keep-users') {
      out.deleteUsers = false
      continue
    }
    if (raw === '--delete-users') {
      out.deleteUsers = true
      continue
    }
    if (raw.startsWith('--emails=')) {
      const rest = raw.slice('--emails='.length)
      out.emails.push(
        ...rest
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      )
    }
  }
  return out
}

async function countHouseholdScoped(client, table, householdIds) {
  if (householdIds.length === 0) {
    return 0
  }
  const r = await client.query(`select count(*)::int as c from ${table} where household_id = any($1::varchar[])`, [
    householdIds,
  ])
  return r.rows[0]?.c ?? 0
}

async function cleanupHouseholds(client, householdIds) {
  if (householdIds.length === 0) {
    return
  }

  const steps = [
    ['insight_events', `delete from insight_events where household_id = any($1::varchar[])`],
    ['recommendations', `delete from recommendations where household_id = any($1::varchar[])`],
    ['notifications', `delete from notifications where household_id = any($1::varchar[])`],
    ['notification_preferences', `delete from notification_preferences where household_id = any($1::varchar[])`],
    ['analytics_events', `delete from analytics_events where household_id = any($1::varchar[])`],
    ['recurring_candidates', `delete from recurring_candidates where household_id = any($1::varchar[])`],
    ['normalized_transactions', `delete from normalized_transactions where household_id = any($1::varchar[])`],
    ['raw_transactions', `delete from raw_transactions where household_id = any($1::varchar[])`],
    ['bank_accounts', `delete from bank_accounts where household_id = any($1::varchar[])`],
    ['institution_links', `delete from institution_links where household_id = any($1::varchar[])`],
    ['consents', `delete from consents where household_id = any($1::varchar[])`],
    ['subscriptions', `delete from subscriptions where household_id = any($1::varchar[])`],
    ['utility_bills', `delete from utility_bills where household_id = any($1::varchar[])`],
    ['household_members', `delete from household_members where household_id = any($1::varchar[])`],
    ['households', `delete from households where id = any($1::varchar[])`],
  ]

  for (const [label, sql] of steps) {
    const r = await client.query(sql, [householdIds])
    if (r.rowCount != null && r.rowCount > 0) {
      console.log(`${label}: ${r.rowCount} rows`)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.emails.length === 0) {
    console.error('Usage: --emails=email1@x.com,email2@y.com [--dry-run] [--keep-users | --delete-users]')
    process.exit(1)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const userRes = await client.query(
      `
        select id, email, default_household_id
        from users
        where email is not null and lower(trim(email)) = any($1::text[])
      `,
      [args.emails],
    )

    if (userRes.rows.length === 0) {
      console.log('No users matched the given email(s). Nothing to do.')
      return
    }

    console.log('Matched users:')
    for (const row of userRes.rows) {
      console.log(`  ${row.id}  ${row.email}  default_household=${row.default_household_id ?? 'null'}`)
    }

    const userIds = userRes.rows.map((r) => r.id)

    const hhRes = await client.query(
      `
        select id, name, owner_user_id
        from households
        where owner_user_id = any($1::varchar[])
      `,
      [userIds],
    )

    const householdIds = hhRes.rows.map((r) => r.id)
    console.log(
      householdIds.length
        ? `Households owned by matched user(s) (${householdIds.length}): ${householdIds.join(', ')}`
        : 'No owned households for matched user(s) (nothing to purge at household level).',
    )

    if (args.dryRun) {
      console.log('\nDry run — row counts that would be affected:\n')
      const tables = [
        'insight_events',
        'recommendations',
        'notifications',
        'notification_preferences',
        'analytics_events',
        'recurring_candidates',
        'normalized_transactions',
        'raw_transactions',
        'bank_accounts',
        'institution_links',
        'consents',
        'subscriptions',
        'utility_bills',
        'household_members',
      ]
      for (const t of tables) {
        const c = await countHouseholdScoped(client, t, householdIds)
        if (c > 0) {
          console.log(`  ${t}: ${c}`)
        }
      }
      const hhCount = await client.query(`select count(*)::int as c from households where id = any($1::varchar[])`, [
        householdIds,
      ])
      if ((hhCount.rows[0]?.c ?? 0) > 0) {
        console.log(`  households (delete by id): ${hhCount.rows[0].c}`)
      }
      const nUserNotif = await client.query(
        `select count(*)::int as c from notifications where user_id = any($1::varchar[])`,
        [userIds],
      )
      const cUserNotif = nUserNotif.rows[0]?.c ?? 0
      if (cUserNotif > 0) {
        console.log(`  notifications (by user_id): ${cUserNotif}`)
      }
      console.log('\nNo data was modified.')
      return
    }

    await client.query('BEGIN')

    if (householdIds.length > 0) {
      await client.query(`update users set default_household_id = null where default_household_id = any($1::varchar[])`, [
        householdIds,
      ])
      await client.query(
        `update auth_sessions set default_household_id = null where default_household_id = any($1::varchar[])`,
        [householdIds],
      )
      await cleanupHouseholds(client, householdIds)
    }

    await client.query(`update users set default_household_id = null where id = any($1::varchar[])`, [userIds])
    await client.query(`delete from notifications where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from notification_preferences where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from analytics_events where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from household_members where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from auth_sessions where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from onboarding_drafts where user_id = any($1::varchar[])`, [userIds])
    await client.query(`delete from email_otp_requests where lower(email_normalized) = any($1::text[])`, [args.emails])
    await client.query(`delete from audit_events where actor_id = any($1::varchar[])`, [userIds])

    if (args.deleteUsers) {
      await client.query(`delete from users where id = any($1::varchar[])`, [userIds])
      console.log(`Deleted user row(s): ${userIds.length}`)
    }

    await client.query('COMMIT')
    console.log('\nCommitted. Sign out in the browser (or clear site data) before re-testing.')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
