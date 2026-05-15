import { randomUUID } from 'node:crypto'
import type { PoolClient, QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'
import type { ConsentCallbackEvent } from './providers/provider.types.js'

export type ConsentStatus =
  | 'draft'
  | 'pending_user_action'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'failed'

export type LinkStatus =
  | 'pending'
  | 'active'
  | 'syncing'
  | 'stale'
  | 'failed'
  | 'repair_required'
  | 'disconnected'

export type Consent = {
  id: string
  householdId: string
  provider: 'setu_aa'
  institutionName: string
  purpose: string
  scope: string[]
  status: ConsentStatus
  issuedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  providerConsentRef: string | null
  createdAt: string
  updatedAt: string
}

export type InstitutionLink = {
  id: string
  consentId: string
  householdId: string
  institutionName: string
  linkStatus: LinkStatus
  lastSuccessfulSyncAt: string | null
  lastFailureReason: string | null
  repairRequired: boolean
  createdAt: string
  updatedAt: string
}

export type ConsentCallbackResult = {
  consent: Consent
  link: InstitutionLink
  transition: 'applied' | 'noop'
}

type ConsentRow = QueryResultRow & {
  id: string
  household_id: string
  provider: 'setu_aa'
  institution_name: string
  purpose: string
  scope: string[]
  status: ConsentStatus
  issued_at: string | Date | null
  expires_at: string | Date | null
  revoked_at: string | Date | null
  provider_consent_ref: string | null
  created_at: string | Date
  updated_at: string | Date
}

type InstitutionLinkRow = QueryResultRow & {
  id: string
  consent_id: string
  household_id: string
  institution_name: string
  link_status: LinkStatus
  last_successful_sync_at: string | Date | null
  last_failure_reason: string | null
  repair_required: boolean
  created_at: string | Date
  updated_at: string | Date
}

const consents = new Map<string, Consent>()
const links = new Map<string, InstitutionLink>()

export async function createConsentSession(input: {
  householdId: string
  institutionName: string
  purpose: string
  scope: string[]
}) {
  const timestamp = new Date().toISOString()
  const consent: Consent = {
    id: `con_${randomUUID()}`,
    householdId: input.householdId,
    provider: 'setu_aa',
    institutionName: input.institutionName,
    purpose: input.purpose,
    scope: input.scope,
    status: 'pending_user_action',
    issuedAt: null,
    expiresAt: null,
    revokedAt: null,
    providerConsentRef: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const link: InstitutionLink = {
    id: `lnk_${randomUUID()}`,
    consentId: consent.id,
    householdId: input.householdId,
    institutionName: input.institutionName,
    linkStatus: 'pending',
    lastSuccessfulSyncAt: null,
    lastFailureReason: null,
    repairRequired: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const pool = getDatabasePool()

  if (!pool) {
    consents.set(consent.id, consent)
    links.set(link.id, link)
    return { consent, link }
  }

  await pool.query('begin')

  try {
    await pool.query(
      `
        insert into consents (
          id, household_id, provider, institution_name, purpose, scope, status, issued_at, expires_at, revoked_at, provider_consent_ref, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        consent.id,
        consent.householdId,
        consent.provider,
        consent.institutionName,
        consent.purpose,
        JSON.stringify(consent.scope),
        consent.status,
        consent.issuedAt,
        consent.expiresAt,
        consent.revokedAt,
        consent.providerConsentRef,
        consent.createdAt,
        consent.updatedAt,
      ],
    )

    await pool.query(
      `
        insert into institution_links (
          id, consent_id, household_id, institution_name, link_status, last_successful_sync_at, last_failure_reason, repair_required, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        link.id,
        link.consentId,
        link.householdId,
        link.institutionName,
        link.linkStatus,
        link.lastSuccessfulSyncAt,
        link.lastFailureReason,
        link.repairRequired,
        link.createdAt,
        link.updatedAt,
      ],
    )

    await pool.query('commit')
  } catch (error) {
    await pool.query('rollback')
    throw error
  }

  return { consent, link }
}

export async function setConsentProviderReference(consentId: string, providerConsentRef: string) {
  const pool = getDatabasePool()
  const timestamp = new Date().toISOString()

  if (!pool) {
    const consent = consents.get(consentId)

    if (!consent) {
      return
    }

    consents.set(consentId, {
      ...consent,
      providerConsentRef,
      updatedAt: timestamp,
    })
    return
  }

  await pool.query(
    `
      update consents
      set provider_consent_ref = $2, updated_at = $3
      where id = $1
    `,
    [consentId, providerConsentRef, timestamp],
  )
}

export async function resolveInternalConsentId(rawConsentId: string): Promise<string | null> {
  if (rawConsentId.startsWith('con_')) {
    const pool = getDatabasePool()

    if (!pool) {
      return consents.has(rawConsentId) ? rawConsentId : null
    }

    const exists = await pool.query(`select 1 from consents where id = $1 limit 1`, [rawConsentId])
    return exists.rowCount ? rawConsentId : null
  }

  const pool = getDatabasePool()

  if (!pool) {
    const match = [...consents.values()].find((consent) => consent.providerConsentRef === rawConsentId)
    return match?.id ?? null
  }

  const result = await pool.query<{ id: string }>(
    `
      select id
      from consents
      where provider_consent_ref = $1
      limit 1
    `,
    [rawConsentId],
  )

  return result.rows[0]?.id ?? null
}

export async function getConsentState(householdId: string, consentId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const consent = consents.get(consentId) ?? null
    const link = [...links.values()].find((item) => item.consentId === consentId) ?? null

    if (!consent || consent.householdId !== householdId || !link) {
      return null
    }

    return { consent, link }
  }

  const consentResult = await pool.query<ConsentRow>(
    `
      select *
      from consents
      where id = $1 and household_id = $2
      limit 1
    `,
    [consentId, householdId],
  )

  const consentRow = consentResult.rows[0]

  if (!consentRow) {
    return null
  }

  const linkResult = await pool.query<InstitutionLinkRow>(
    `
      select *
      from institution_links
      where consent_id = $1 and household_id = $2
      limit 1
    `,
    [consentId, householdId],
  )

  const linkRow = linkResult.rows[0]

  if (!linkRow) {
    return null
  }

  return { consent: mapConsentRow(consentRow), link: mapLinkRow(linkRow) }
}

export async function listInstitutionLinks(householdId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...links.values()]
      .filter((link) => link.householdId === householdId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  const result = await pool.query<InstitutionLinkRow>(
    `
      select *
      from institution_links
      where household_id = $1
      order by updated_at desc
    `,
    [householdId],
  )

  return result.rows.map(mapLinkRow)
}

function isConsentCallbackNoop(
  consent: Consent,
  link: InstitutionLink,
  eventType: ConsentCallbackEvent,
): boolean {
  if (eventType === 'consent.approved') {
    if (consent.status === 'active') {
      return true
    }

    if (consent.status !== 'pending_user_action') {
      return true
    }

    return false
  }

  if (eventType === 'consent.failed') {
    if (consent.status === 'failed') {
      return true
    }

    if (consent.status === 'active') {
      return true
    }

    if (consent.status !== 'pending_user_action') {
      return true
    }

    return false
  }

  if (consent.status === 'revoked' || link.linkStatus === 'disconnected') {
    return true
  }

  return false
}

export async function processConsentCallback(
  consentId: string,
  eventType: ConsentCallbackEvent,
): Promise<ConsentCallbackResult | null> {
  const pool = getDatabasePool()

  if (!pool) {
    const consent = consents.get(consentId)

    if (!consent) {
      return null
    }

    const link = [...links.values()].find((item) => item.consentId === consentId) ?? null

    if (!link) {
      return null
    }

    if (isConsentCallbackNoop(consent, link, eventType)) {
      return { consent, link, transition: 'noop' }
    }

    const nextState = buildCallbackState(consent, link, eventType)
    consents.set(nextState.consent.id, nextState.consent)
    links.set(nextState.link.id, nextState.link)

    return {
      consent: nextState.consent,
      link: nextState.link,
      transition: 'applied',
    }
  }

  const state = await getConsentStateById(consentId)

  if (!state) {
    return null
  }

  if (isConsentCallbackNoop(state.consent, state.link, eventType)) {
    return { consent: state.consent, link: state.link, transition: 'noop' }
  }

  const nextState = buildCallbackState(state.consent, state.link, eventType)

  const client = await pool.connect()

  try {
    await client.query('begin')

    try {
      await client.query(
        `
        update consents
        set
          status = $2,
          issued_at = $3,
          expires_at = $4,
          revoked_at = $5,
          updated_at = $6
        where id = $1
      `,
        [
          nextState.consent.id,
          nextState.consent.status,
          nextState.consent.issuedAt,
          nextState.consent.expiresAt,
          nextState.consent.revokedAt,
          nextState.consent.updatedAt,
        ],
      )

      await client.query(
        `
        update institution_links
        set
          link_status = $2,
          last_successful_sync_at = $3,
          last_failure_reason = $4,
          repair_required = $5,
          updated_at = $6
        where id = $1
      `,
        [
          nextState.link.id,
          nextState.link.linkStatus,
          nextState.link.lastSuccessfulSyncAt,
          nextState.link.lastFailureReason,
          nextState.link.repairRequired,
          nextState.link.updatedAt,
        ],
      )

      if (eventType === 'consent.approved') {
        await ensureBankAccountForLink(
          nextState.link.id,
          nextState.link.householdId,
          nextState.link.updatedAt,
          client,
        )
      }

      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  } finally {
    client.release()
  }

  return {
    consent: nextState.consent,
    link: nextState.link,
    transition: 'applied',
  }
}

export async function startInstitutionLinkSync(
  householdId: string,
  linkId: string,
  operation: 'refresh' | 'repair',
) {
  const patch: Partial<
    Pick<
      InstitutionLink,
      'linkStatus' | 'lastSuccessfulSyncAt' | 'lastFailureReason' | 'repairRequired'
    >
  > = {
    linkStatus: 'syncing',
    repairRequired: false,
  }

  if (operation === 'repair') {
    patch.lastFailureReason = null
  }

  return updateInstitutionLink(householdId, linkId, patch)
}

export async function completeInstitutionLinkSync(
  householdId: string,
  linkId: string,
  options?: {
    succeededAt?: string
    lastFailureReason?: string | null
    repairRequired?: boolean
  },
) {
  return updateInstitutionLink(householdId, linkId, {
    linkStatus: options?.repairRequired ? 'repair_required' : 'active',
    lastSuccessfulSyncAt: options?.repairRequired ? null : options?.succeededAt ?? new Date().toISOString(),
    lastFailureReason: options?.lastFailureReason ?? null,
    repairRequired: options?.repairRequired ?? false,
  })
}

export async function refreshInstitutionLink(householdId: string, linkId: string) {
  return completeInstitutionLinkSync(householdId, linkId, {
    succeededAt: new Date().toISOString(),
  })
}

export async function repairInstitutionLink(householdId: string, linkId: string) {
  return completeInstitutionLinkSync(householdId, linkId, {
    succeededAt: new Date().toISOString(),
  })
}

async function updateInstitutionLink(
  householdId: string,
  linkId: string,
  patch: Partial<Pick<InstitutionLink, 'linkStatus' | 'lastSuccessfulSyncAt' | 'lastFailureReason' | 'repairRequired'>>,
) {
  const pool = getDatabasePool()

  if (!pool) {
    const existing = links.get(linkId)

    if (!existing || existing.householdId !== householdId) {
      return null
    }

    const nextLink = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    links.set(linkId, nextLink)
    return nextLink
  }

  const result = await pool.query<InstitutionLinkRow>(
    `
      select *
      from institution_links
      where id = $1 and household_id = $2
      limit 1
    `,
    [linkId, householdId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  const existing = mapLinkRow(row)
  const nextLink = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  await pool.query(
    `
      update institution_links
      set
        link_status = $3,
        last_successful_sync_at = $4,
        last_failure_reason = $5,
        repair_required = $6,
        updated_at = $7
      where id = $1 and household_id = $2
    `,
    [
      nextLink.id,
      nextLink.householdId,
      nextLink.linkStatus,
      nextLink.lastSuccessfulSyncAt,
      nextLink.lastFailureReason,
      nextLink.repairRequired,
      nextLink.updatedAt,
    ],
  )

  return nextLink
}

async function getConsentStateById(consentId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    let consent = consents.get(consentId) ?? null

    if (!consent) {
      consent = [...consents.values()].find((item) => item.providerConsentRef === consentId) ?? null
    }

    const link = consent
      ? ([...links.values()].find((item) => item.consentId === consent.id) ?? null)
      : null
    return consent && link ? { consent, link } : null
  }

  const idLookup = await pool.query<{ id: string }>(
    `
      select id
      from consents
      where id = $1 or provider_consent_ref = $1
      limit 1
    `,
    [consentId],
  )

  const internalId = idLookup.rows[0]?.id

  if (!internalId) {
    return null
  }

  const consentResult = await pool.query<ConsentRow>(
    `
      select *
      from consents
      where id = $1
      limit 1
    `,
    [internalId],
  )

  const consentRow = consentResult.rows[0]

  if (!consentRow) {
    return null
  }

  const linkResult = await pool.query<InstitutionLinkRow>(
    `
      select *
      from institution_links
      where consent_id = $1
      limit 1
    `,
    [internalId],
  )

  const linkRow = linkResult.rows[0]

  if (!linkRow) {
    return null
  }

  return {
    consent: mapConsentRow(consentRow),
    link: mapLinkRow(linkRow),
  }
}

function buildCallbackState(
  consent: Consent,
  link: InstitutionLink,
  eventType: ConsentCallbackEvent,
) {
  const timestamp = new Date().toISOString()

  if (eventType === 'consent.approved') {
    return {
      consent: {
        ...consent,
        status: 'active' as const,
        issuedAt: timestamp,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: null,
        updatedAt: timestamp,
      },
      link: {
        ...link,
        linkStatus: 'active' as const,
        lastSuccessfulSyncAt: timestamp,
        lastFailureReason: null,
        repairRequired: false,
        updatedAt: timestamp,
      },
    }
  }

  if (eventType === 'consent.failed') {
    return {
      consent: {
        ...consent,
        status: 'failed' as const,
        updatedAt: timestamp,
      },
      link: {
        ...link,
        linkStatus: 'failed' as const,
        lastFailureReason: 'Consent could not be completed at the provider',
        repairRequired: true,
        updatedAt: timestamp,
      },
    }
  }

  return {
    consent: {
      ...consent,
      status: 'revoked' as const,
      revokedAt: timestamp,
      updatedAt: timestamp,
    },
    link: {
      ...link,
      linkStatus: 'disconnected' as const,
      lastFailureReason: 'Consent was revoked by the customer',
      repairRequired: false,
      updatedAt: timestamp,
    },
  }
}

async function ensureBankAccountForLink(
  institutionLinkId: string,
  householdId: string,
  timestamp: string,
  client?: PoolClient,
) {
  const executor = client ?? getDatabasePool()

  if (!executor) {
    return
  }

  const accountExists = await executor.query(
    `
      select 1
      from bank_accounts
      where institution_link_id = $1
      limit 1
    `,
    [institutionLinkId],
  )

  if (accountExists.rowCount !== 0) {
    return
  }

  await executor.query(
    `
      insert into bank_accounts (
        id, institution_link_id, household_id, account_type, masked_account_reference, provider_account_id, account_status, created_at, updated_at
      )
      values ($1, $2, $3, 'savings', $4, $5, 'active', $6, $6)
    `,
    [
      `acct_${randomUUID()}`,
      institutionLinkId,
      householdId,
      'XXXX4321',
      `mock_${institutionLinkId}`,
      timestamp,
    ],
  )
}

function mapConsentRow(row: ConsentRow): Consent {
  return {
    id: row.id,
    householdId: row.household_id,
    provider: row.provider,
    institutionName: row.institution_name,
    purpose: row.purpose,
    scope: row.scope ?? [],
    status: row.status,
    issuedAt: row.issued_at ? new Date(row.issued_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    providerConsentRef: row.provider_consent_ref ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapLinkRow(row: InstitutionLinkRow): InstitutionLink {
  return {
    id: row.id,
    consentId: row.consent_id,
    householdId: row.household_id,
    institutionName: row.institution_name,
    linkStatus: row.link_status,
    lastSuccessfulSyncAt: row.last_successful_sync_at
      ? new Date(row.last_successful_sync_at).toISOString()
      : null,
    lastFailureReason: row.last_failure_reason,
    repairRequired: row.repair_required,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}
