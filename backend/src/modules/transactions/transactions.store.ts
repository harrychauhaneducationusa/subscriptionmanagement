import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'

type BankAccountRow = QueryResultRow & {
  id: string
  household_id: string
  institution_link_id: string
  account_type: string
  masked_account_reference: string
}

type InstitutionLinkRow = QueryResultRow & {
  id: string
  household_id: string
  consent_id: string
  institution_name: string
}

type RawTransactionRow = QueryResultRow & {
  id: string
  household_id: string
  institution_link_id: string
  bank_account_id: string
  consent_id: string
  provider_transaction_id: string | null
  description_raw: string
  amount: string | number
  direction: 'debit' | 'credit'
  occurred_at: string | Date
  ingestion_batch_id: string
}

type MerchantProfileRow = QueryResultRow & {
  id: string
  display_name: string
  merchant_type: string
  category_default: string
}

type RecentTransactionRow = QueryResultRow & {
  id: string
  description_normalized: string
  category: string
  amount: string | number
  occurred_at: string | Date
  display_name: string | null
  description_raw: string
}

type MockTransaction = {
  providerTransactionId: string
  descriptionRaw: string
  amount: number
  direction: 'debit' | 'credit'
  occurredAt: string
  categoryHint: string
  merchantTypeHint: string
  displayNameHint: string
}

export type RecentTransaction = {
  id: string
  description: string
  category: string
  amount: number
  occurredAt: string
}

export async function ingestMockTransactionsForLink(linkId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return {
      ingestionBatchId: `ing_${randomUUID()}`,
      insertedRawTransactionIds: [],
    }
  }

  const linkResult = await pool.query<InstitutionLinkRow>(
    `
      select id, household_id, consent_id, institution_name
      from institution_links
      where id = $1
      limit 1
    `,
    [linkId],
  )

  const link = linkResult.rows[0]

  if (!link) {
    return null
  }

  const accountsResult = await pool.query<BankAccountRow>(
    `
      select id, household_id, institution_link_id, account_type, masked_account_reference
      from bank_accounts
      where institution_link_id = $1 and account_status = 'active'
    `,
    [linkId],
  )

  const account = accountsResult.rows[0]

  if (!account) {
    return {
      ingestionBatchId: `ing_${randomUUID()}`,
      insertedRawTransactionIds: [],
    }
  }

  const ingestionBatchId = `ing_${randomUUID()}`
  const mockTransactions = buildMockTransactions(link, account)
  const insertedRawTransactionIds: string[] = []

  for (const transaction of mockTransactions) {
    const rawTransactionId = `rtx_${randomUUID()}`
    const insertResult = await pool.query(
      `
        insert into raw_transactions (
          id,
          household_id,
          institution_link_id,
          bank_account_id,
          consent_id,
          provider_transaction_id,
          description_raw,
          amount,
          direction,
          occurred_at,
          ingestion_batch_id,
          source_payload,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, current_timestamp)
        on conflict (bank_account_id, provider_transaction_id) do nothing
        returning id
      `,
      [
        rawTransactionId,
        link.household_id,
        link.id,
        account.id,
        link.consent_id,
        transaction.providerTransactionId,
        transaction.descriptionRaw,
        transaction.amount,
        transaction.direction,
        transaction.occurredAt,
        ingestionBatchId,
        JSON.stringify(transaction),
      ],
    )

    const insertedId = insertResult.rows[0]?.id as string | undefined

    if (insertedId) {
      insertedRawTransactionIds.push(insertedId)
    }
  }

  return {
    ingestionBatchId,
    insertedRawTransactionIds,
  }
}

export async function normalizeRawTransactions(rawTransactionIds: string[]) {
  if (rawTransactionIds.length === 0) {
    return []
  }

  const pool = getDatabasePool()

  if (!pool) {
    return []
  }

  const result = await pool.query<RawTransactionRow>(
    `
      select
        id,
        household_id,
        institution_link_id,
        bank_account_id,
        consent_id,
        provider_transaction_id,
        description_raw,
        amount,
        direction,
        occurred_at,
        ingestion_batch_id
      from raw_transactions
      where id = any($1::varchar[])
    `,
    [rawTransactionIds],
  )

  const normalizedIds: string[] = []

  for (const row of result.rows) {
    const normalizedDescriptor = normalizeDescriptor(row.description_raw)
    const merchant = await getOrCreateMerchantProfile(normalizedDescriptor)
    const normalizedId = `ntx_${randomUUID()}`
    const category = merchant.category_default

    const recurringSignals = {
      cadence_hint: inferCadenceHint(normalizedDescriptor),
      source: 'mock_rules',
    }

    const insertResult = await pool.query(
      `
        insert into normalized_transactions (
          id,
          household_id,
          raw_transaction_id,
          merchant_profile_id,
          description_normalized,
          category,
          amount,
          recurring_signals,
          duplicate_flags,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, current_timestamp, current_timestamp)
        on conflict (raw_transaction_id) do nothing
        returning id
      `,
      [
        normalizedId,
        row.household_id,
        row.id,
        merchant.id,
        normalizedDescriptor,
        category,
        row.amount,
        JSON.stringify(recurringSignals),
        JSON.stringify({ duplicate: false }),
      ],
    )

    const insertedId = insertResult.rows[0]?.id as string | undefined

    if (insertedId) {
      normalizedIds.push(insertedId)
    }
  }

  return normalizedIds
}

export async function listRecentNormalizedTransactions(householdId: string, limit = 12) {
  const pool = getDatabasePool()

  if (!pool) {
    return []
  }

  const result = await pool.query<RecentTransactionRow>(
    `
      select
        nt.id,
        nt.description_normalized,
        nt.category,
        nt.amount,
        rt.occurred_at,
        mp.display_name,
        rt.description_raw
      from normalized_transactions nt
      join raw_transactions rt on rt.id = nt.raw_transaction_id
      left join merchant_profiles mp on mp.id = nt.merchant_profile_id
      where nt.household_id = $1
      order by rt.occurred_at desc
      limit $2
    `,
    [householdId, limit],
  )

  return result.rows.map((row) => ({
    id: row.id,
    description: row.display_name ?? row.description_normalized ?? row.description_raw,
    category: row.category,
    amount: toNumber(row.amount),
    occurredAt: new Date(row.occurred_at).toISOString(),
  }))
}

async function getOrCreateMerchantProfile(descriptorNormalized: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return {
      id: `mrc_${randomUUID()}`,
      display_name: descriptorNormalized,
      merchant_type: 'subscription',
      category_default: 'subscriptions',
    }
  }

  const aliasResult = await pool.query<MerchantProfileRow>(
    `
      select mp.id, mp.display_name, mp.merchant_type, mp.category_default
      from merchant_aliases ma
      join merchant_profiles mp on mp.id = ma.merchant_profile_id
      where ma.descriptor_normalized = $1
      limit 1
    `,
    [descriptorNormalized],
  )

  const existingMerchant = aliasResult.rows[0]

  if (existingMerchant) {
    return existingMerchant
  }

  const merchantId = `mrc_${randomUUID()}`
  const displayName = titleCase(descriptorNormalized)
  const merchantType = inferMerchantType(descriptorNormalized)
  const categoryDefault = inferCategory(descriptorNormalized)

  await pool.query('begin')

  try {
    await pool.query(
      `
        insert into merchant_profiles (
          id,
          display_name,
          merchant_type,
          category_default,
          quality_score,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      `,
      [merchantId, displayName, merchantType, categoryDefault, 0.85],
    )

    await pool.query(
      `
        insert into merchant_aliases (
          id,
          merchant_profile_id,
          descriptor_raw,
          descriptor_normalized,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, current_timestamp, current_timestamp)
      `,
      [`mal_${randomUUID()}`, merchantId, descriptorNormalized, descriptorNormalized],
    )

    await pool.query('commit')
  } catch (error) {
    await pool.query('rollback')
    throw error
  }

  return {
    id: merchantId,
    display_name: displayName,
    merchant_type: merchantType,
    category_default: categoryDefault,
  }
}

function buildMockTransactions(link: InstitutionLinkRow, account: BankAccountRow): MockTransaction[] {
  const today = Date.now()
  const base = [
    {
      merchant: 'NETFLIX INDIA',
      amount: 649,
      daysAgo: 4,
      categoryHint: 'streaming',
      merchantTypeHint: 'subscription',
      displayNameHint: 'Netflix',
    },
    {
      merchant: 'SPOTIFY PREMIUM',
      amount: 179,
      daysAgo: 12,
      categoryHint: 'music',
      merchantTypeHint: 'subscription',
      displayNameHint: 'Spotify',
    },
    {
      merchant: 'TATA POWER DELHI',
      amount: 2140,
      daysAgo: 18,
      categoryHint: 'utilities',
      merchantTypeHint: 'utility',
      displayNameHint: 'Tata Power',
    },
    {
      merchant: 'AIRTEL FIBER',
      amount: 1299,
      daysAgo: 28,
      categoryHint: 'internet',
      merchantTypeHint: 'utility',
      displayNameHint: 'Airtel Fiber',
    },
    {
      merchant: `${link.institution_name} ATM CASH`,
      amount: 1000,
      daysAgo: 2,
      categoryHint: 'cash',
      merchantTypeHint: 'other',
      displayNameHint: `${link.institution_name} ATM`,
    },
  ]

  return base.map((item, index) => ({
    providerTransactionId: `${account.id}_${index}_${Math.floor(item.daysAgo / 2)}`,
    descriptionRaw: item.merchant,
    amount: item.amount,
    direction: 'debit',
    occurredAt: new Date(today - item.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    categoryHint: item.categoryHint,
    merchantTypeHint: item.merchantTypeHint,
    displayNameHint: item.displayNameHint,
  }))
}

function normalizeDescriptor(descriptionRaw: string) {
  return descriptionRaw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function inferCategory(descriptor: string) {
  if (descriptor.includes('netflix') || descriptor.includes('spotify')) {
    return 'subscriptions'
  }

  if (descriptor.includes('power')) {
    return 'utilities'
  }

  if (descriptor.includes('fiber') || descriptor.includes('broadband') || descriptor.includes('internet')) {
    return 'internet'
  }

  return 'other'
}

function inferMerchantType(descriptor: string) {
  if (descriptor.includes('power') || descriptor.includes('fiber') || descriptor.includes('broadband')) {
    return 'utility'
  }

  if (descriptor.includes('netflix') || descriptor.includes('spotify')) {
    return 'subscription'
  }

  return 'other'
}

function inferCadenceHint(descriptor: string) {
  if (descriptor.includes('netflix') || descriptor.includes('spotify') || descriptor.includes('power') || descriptor.includes('fiber')) {
    return 'monthly'
  }

  return 'unknown'
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
