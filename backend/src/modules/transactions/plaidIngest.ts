import { randomUUID } from 'node:crypto'
import type { Transaction } from 'plaid'
import { getPlaidApiClient } from '../aggregation/plaid/plaidClient.js'
import { getPlaidAccessTokenForLink } from '../aggregation/aggregation.store.js'
import { getDatabasePool } from '../../config/database.js'

type BankAccountRow = {
  id: string
  household_id: string
  institution_link_id: string
  provider_account_id: string
}

type InstitutionLinkRow = {
  id: string
  household_id: string
  consent_id: string
  institution_name: string
}

function mapPlaidDirection(amount: number): 'debit' | 'credit' {
  return amount > 0 ? 'debit' : 'credit'
}

function mapPlaidAmount(amount: number) {
  return Math.abs(amount)
}

export async function ingestPlaidTransactionsForLink(linkId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return {
      ingestionBatchId: `ing_${randomUUID()}`,
      insertedRawTransactionIds: [],
    }
  }

  const accessToken = await getPlaidAccessTokenForLink(linkId)

  if (!accessToken) {
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
      select id, household_id, institution_link_id, provider_account_id
      from bank_accounts
      where institution_link_id = $1 and account_status = 'active'
    `,
    [linkId],
  )

  const accountsByProviderId = new Map(
    accountsResult.rows.map((row) => [row.provider_account_id, row]),
  )

  if (accountsByProviderId.size === 0) {
    return {
      ingestionBatchId: `ing_${randomUUID()}`,
      insertedRawTransactionIds: [],
    }
  }

  const client = getPlaidApiClient()
  const ingestionBatchId = `ing_${randomUUID()}`
  const insertedRawTransactionIds: string[] = []
  let cursor: string | undefined

  for (;;) {
    const syncResponse = await client.transactionsSync({
      access_token: accessToken,
      cursor,
    })

    for (const transaction of syncResponse.data.added) {
      const account = accountsByProviderId.get(transaction.account_id)

      if (!account) {
        continue
      }

      const insertedId = await insertPlaidRawTransaction({
        link,
        account,
        transaction,
        ingestionBatchId,
      })

      if (insertedId) {
        insertedRawTransactionIds.push(insertedId)
      }
    }

    cursor = syncResponse.data.next_cursor

    if (!syncResponse.data.has_more) {
      break
    }
  }

  return {
    ingestionBatchId,
    insertedRawTransactionIds,
  }
}

async function insertPlaidRawTransaction(input: {
  link: InstitutionLinkRow
  account: BankAccountRow
  transaction: Transaction
  ingestionBatchId: string
}) {
  const pool = getDatabasePool()

  if (!pool) {
    return null
  }

  const { transaction } = input
  const occurredAt = transaction.datetime ?? transaction.date
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
      input.link.household_id,
      input.link.id,
      input.account.id,
      input.link.consent_id,
      transaction.transaction_id,
      transaction.name,
      mapPlaidAmount(transaction.amount),
      mapPlaidDirection(transaction.amount),
      occurredAt,
      input.ingestionBatchId,
      JSON.stringify({
        plaid_transaction_id: transaction.transaction_id,
        merchant_name: transaction.merchant_name,
        category: transaction.personal_finance_category?.primary,
      }),
    ],
  )

  return (insertResult.rows[0]?.id as string | undefined) ?? null
}
