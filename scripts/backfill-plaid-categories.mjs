#!/usr/bin/env node
/**
 * Re-applies Plaid PFC → internal category mapping on existing normalized_transactions
 * that were ingested before category mapping shipped.
 */
import pg from 'pg'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
config({ path: resolve(repoRoot, '.env') })

const PLAID_PRIMARY_TO_CATEGORY = {
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
}

function mapPlaidCategory(plaidPrimary) {
  if (!plaidPrimary) return null
  return PLAID_PRIMARY_TO_CATEGORY[String(plaidPrimary).trim().toUpperCase()] ?? null
}

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://harendrachauhan@localhost:5432/subsense'

const pool = new pg.Pool({ connectionString })

try {
  const { rows } = await pool.query(`
    select nt.id, rt.source_payload
    from normalized_transactions nt
    join raw_transactions rt on rt.id = nt.raw_transaction_id
    join institution_links il on il.id = rt.institution_link_id
    join consents c on c.id = il.consent_id
    where c.provider = 'plaid'
      and rt.source_payload->>'category' is not null
  `)

  let updated = 0

  for (const row of rows) {
    const payload =
      typeof row.source_payload === 'string'
        ? JSON.parse(row.source_payload)
        : row.source_payload
    const mapped = mapPlaidCategory(payload?.category)

    if (!mapped) continue

    const result = await pool.query(
      `
        update normalized_transactions
        set category = $2,
            recurring_signals = coalesce(recurring_signals, '{}'::jsonb) || '{"source":"plaid_pfc"}'::jsonb,
            updated_at = current_timestamp
        where id = $1 and category is distinct from $2
        returning id
      `,
      [row.id, mapped],
    )

    if (result.rowCount > 0) updated += 1
  }

  console.log(`Backfill complete: ${updated} of ${rows.length} Plaid normalized rows updated.`)
} finally {
  await pool.end()
}
