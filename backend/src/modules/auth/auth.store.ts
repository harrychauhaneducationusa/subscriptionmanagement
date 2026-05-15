import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { getDatabasePool } from '../../config/database.js'

export type AuthSession = {
  sessionId: string
  userId: string
  phoneNumberMasked: string
  authState: 'verified'
  defaultHouseholdId: string | null
  lifecycleStatus: 'active'
  createdAt: string
}

export type AppUser = {
  id: string
  phoneNumberMasked: string
  email: string | null
  displayName: string | null
  authProvider: 'phone' | 'email' | 'google'
  authState: 'verified'
  defaultHouseholdId: string | null
  lifecycleStatus: 'active'
  createdAt: string
}

type OtpRequest = {
  requestId: string
  phoneNumber: string
  requestedAt: string
}

type UserRecord = AppUser & {
  phoneNumber: string | null
}

type SessionRow = QueryResultRow & {
  id: string
  user_id: string
  phone_number_masked: string
  auth_state: 'verified'
  default_household_id: string | null
  lifecycle_status: 'active'
  created_at: string | Date
}

type UserRow = QueryResultRow & {
  id: string
  phone_number_e164: string | null
  phone_number_masked: string
  email: string | null
  email_verified: boolean
  display_name: string | null
  auth_provider: string
  auth_state: 'verified'
  default_household_id: string | null
  lifecycle_status: 'active'
  created_at: string | Date
}

type OtpRequestRow = QueryResultRow & {
  id: string
  phone_number: string
  requested_at: string | Date
}

const otpRequests = new Map<string, OtpRequest>()
const sessions = new Map<string, AuthSession>()
const usersByPhone = new Map<string, UserRecord>()
const usersById = new Map<string, UserRecord>()

export async function createOtpRequest(phoneNumber: string) {
  const requestId = `otp_${randomUUID()}`
  const request: OtpRequest = {
    requestId,
    phoneNumber,
    requestedAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    otpRequests.set(requestId, request)
    return request
  }

  await pool.query(
    `
      insert into otp_requests (id, phone_number, requested_at)
      values ($1, $2, $3)
    `,
    [request.requestId, request.phoneNumber, request.requestedAt],
  )

  return request
}

export async function getOtpRequest(requestId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return otpRequests.get(requestId) ?? null
  }

  const result = await pool.query<OtpRequestRow>(
    `
      select id, phone_number, requested_at
      from otp_requests
      where id = $1
      limit 1
    `,
    [requestId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  return {
    requestId: row.id,
    phoneNumber: row.phone_number,
    requestedAt: new Date(row.requested_at).toISOString(),
  }
}

export async function findOrCreateVerifiedUser(phoneNumber: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const existingUser = usersByPhone.get(phoneNumber)

    if (existingUser) {
      return toAppUser(existingUser)
    }

    const createdUser: UserRecord = {
      id: `usr_${randomUUID()}`,
      phoneNumber: phoneNumber,
      phoneNumberMasked: maskPhoneNumber(phoneNumber),
      email: null,
      displayName: null,
      authProvider: 'phone',
      authState: 'verified',
      defaultHouseholdId: null,
      lifecycleStatus: 'active',
      createdAt: new Date().toISOString(),
    }

    usersByPhone.set(phoneNumber, createdUser)
    usersById.set(createdUser.id, createdUser)
    return toAppUser(createdUser)
  }

  const existingResult = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where phone_number_e164 = $1
      limit 1
    `,
    [phoneNumber],
  )

  const existingUser = existingResult.rows[0]

  if (existingUser) {
    return mapUserRow(existingUser)
  }

  const createdUser = {
    id: `usr_${randomUUID()}`,
    phoneNumber: phoneNumber,
    phoneNumberMasked: maskPhoneNumber(phoneNumber),
    authState: 'verified' as const,
    defaultHouseholdId: null,
    lifecycleStatus: 'active' as const,
    createdAt: new Date().toISOString(),
  }

  await pool.query(
    `
      insert into users (
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        oauth_provider,
        oauth_provider_id,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at,
        updated_at
      )
      values ($1, $2, $3, null, false, null, 'phone', null, null, $4, $5, $6, $7, $7)
    `,
    [
      createdUser.id,
      createdUser.phoneNumber,
      createdUser.phoneNumberMasked,
      createdUser.authState,
      createdUser.defaultHouseholdId,
      createdUser.lifecycleStatus,
      createdUser.createdAt,
    ],
  )

  const inserted = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where id = $1
      limit 1
    `,
    [createdUser.id],
  )

  const row = inserted.rows[0]

  if (!row) {
    throw new Error('User insert failed')
  }

  return mapUserRow(row)
}

export async function findOrCreateVerifiedUserFromEmail(email: string) {
  const pool = getDatabasePool()

  if (!pool) {
    throw new Error('Email sign-in requires DATABASE_URL')
  }

  const normalized = normalizeEmail(email)

  const existingResult = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [normalized],
  )

  const existingUser = existingResult.rows[0]

  if (existingUser) {
    await pool.query(
      `
        update users
        set
          email = coalesce(email, $2),
          email_verified = true,
          updated_at = current_timestamp
        where id = $1
      `,
      [existingUser.id, normalized],
    )

    const refreshed = await pool.query<UserRow>(
      `
        select
          id,
          phone_number_e164,
          phone_number_masked,
          email,
          email_verified,
          display_name,
          auth_provider,
          auth_state,
          default_household_id,
          lifecycle_status,
          created_at
        from users
        where id = $1
        limit 1
      `,
      [existingUser.id],
    )

    const row = refreshed.rows[0]

    if (!row) {
      throw new Error('User refresh failed')
    }

    return mapUserRow(row)
  }

  const id = `usr_${randomUUID()}`
  const masked = maskEmail(normalized)
  const createdAt = new Date().toISOString()

  await pool.query(
    `
      insert into users (
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        oauth_provider,
        oauth_provider_id,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at,
        updated_at
      )
      values ($1, null, $2, $3, true, null, 'email', null, null, 'verified', null, 'active', $4, $4)
    `,
    [id, masked, normalized, createdAt],
  )

  const inserted = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where id = $1
      limit 1
    `,
    [id],
  )

  const row = inserted.rows[0]

  if (!row) {
    throw new Error('User insert failed')
  }

  return mapUserRow(row)
}

export async function findOrCreateGoogleProfile(input: {
  email: string
  oauthSub: string
  displayName: string | null
}) {
  const pool = getDatabasePool()

  if (!pool) {
    throw new Error('Google sign-in requires DATABASE_URL')
  }

  const normalizedEmail = normalizeEmail(input.email)

  const oauthHit = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where oauth_provider = 'google' and oauth_provider_id = $1
      limit 1
    `,
    [input.oauthSub],
  )

  if (oauthHit.rows[0]) {
    return mapUserRow(oauthHit.rows[0])
  }

  const emailHit = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [normalizedEmail],
  )

  const existingByEmail = emailHit.rows[0]

  if (existingByEmail) {
    const displayName = input.displayName ?? existingByEmail.display_name
    const masked =
      existingByEmail.phone_number_e164 !== null
        ? existingByEmail.phone_number_masked
        : maskEmail(normalizedEmail)

    await pool.query(
      `
        update users
        set
          oauth_provider = 'google',
          oauth_provider_id = $2,
          email = coalesce(email, $3),
          email_verified = true,
          display_name = coalesce($4, display_name),
          phone_number_masked = $5,
          updated_at = current_timestamp
        where id = $1
      `,
      [existingByEmail.id, input.oauthSub, normalizedEmail, displayName, masked],
    )

    const refreshed = await pool.query<UserRow>(
      `
        select
          id,
          phone_number_e164,
          phone_number_masked,
          email,
          email_verified,
          display_name,
          auth_provider,
          auth_state,
          default_household_id,
          lifecycle_status,
          created_at
        from users
        where id = $1
        limit 1
      `,
      [existingByEmail.id],
    )

    return mapUserRow(refreshed.rows[0]!)
  }

  const id = `usr_${randomUUID()}`
  const masked = maskEmail(normalizedEmail)
  const createdAt = new Date().toISOString()
  const displayName = input.displayName

  await pool.query(
    `
      insert into users (
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        oauth_provider,
        oauth_provider_id,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at,
        updated_at
      )
      values ($1, null, $2, $3, true, $4, 'google', 'google', $5, 'verified', null, 'active', $6, $6)
    `,
    [id, masked, normalizedEmail, displayName, input.oauthSub, createdAt],
  )

  const inserted = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where id = $1
      limit 1
    `,
    [id],
  )

  return mapUserRow(inserted.rows[0]!)
}

export async function getAppUserById(userId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const user = usersById.get(userId)
    return user ? toAppUser(user) : null
  }

  const result = await pool.query<UserRow>(
    `
      select
        id,
        phone_number_e164,
        phone_number_masked,
        email,
        email_verified,
        display_name,
        auth_provider,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      from users
      where id = $1
      limit 1
    `,
    [userId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  return mapUserRow(row)
}

export async function createSession(input: {
  userId: string
  phoneNumberMasked: string
  defaultHouseholdId: string | null
}) {
  const session: AuthSession = {
    sessionId: `ses_${randomUUID()}`,
    userId: input.userId,
    phoneNumberMasked: input.phoneNumberMasked,
    authState: 'verified',
    defaultHouseholdId: input.defaultHouseholdId,
    lifecycleStatus: 'active',
    createdAt: new Date().toISOString(),
  }

  const pool = getDatabasePool()

  if (!pool) {
    sessions.set(session.sessionId, session)
    return session
  }

  await pool.query(
    `
      insert into auth_sessions (
        id,
        user_id,
        phone_number_masked,
        auth_state,
        default_household_id,
        lifecycle_status,
        created_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      session.sessionId,
      session.userId,
      session.phoneNumberMasked,
      session.authState,
      session.defaultHouseholdId,
      session.lifecycleStatus,
      session.createdAt,
    ],
  )

  return session
}

export async function getSession(sessionId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return sessions.get(sessionId) ?? null
  }

  const result = await pool.query<SessionRow>(
    `
      select id, user_id, phone_number_masked, auth_state, default_household_id, lifecycle_status, created_at
      from auth_sessions
      where id = $1
      limit 1
    `,
    [sessionId],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  return mapSessionRow(row)
}

export async function setDefaultHouseholdForUserAndSession(input: {
  userId: string
  sessionId: string
  householdId: string
}) {
  const pool = getDatabasePool()

  if (!pool) {
    const user = usersById.get(input.userId)
    const session = sessions.get(input.sessionId)

    if (user) {
      const nextUser = { ...user, defaultHouseholdId: input.householdId }
      usersById.set(nextUser.id, nextUser)

      if (nextUser.phoneNumber) {
        usersByPhone.set(nextUser.phoneNumber, nextUser)
      }
    }

    if (session) {
      sessions.set(session.sessionId, {
        ...session,
        defaultHouseholdId: input.householdId,
      })
    }

    return
  }

  await Promise.all([
    pool.query(
      `
        update users
        set default_household_id = $2, updated_at = current_timestamp
        where id = $1
      `,
      [input.userId, input.householdId],
    ),
    pool.query(
      `
        update auth_sessions
        set default_household_id = $2
        where id = $1
      `,
      [input.sessionId, input.householdId],
    ),
  ])
}

export function maskPhoneNumber(phoneNumber: string) {
  const lastFour = phoneNumber.slice(-4)
  return `******${lastFour}`
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function maskEmail(email: string) {
  const at = email.indexOf('@')

  if (at < 1) {
    return '***'
  }

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const prefix = local.slice(0, Math.min(2, local.length))

  return `${prefix}***@${domain}`.slice(0, 120)
}

function mapUserRow(row: UserRow): AppUser {
  return {
    id: row.id,
    phoneNumberMasked: row.phone_number_masked,
    email: row.email,
    displayName: row.display_name,
    authProvider: row.auth_provider as AppUser['authProvider'],
    authState: row.auth_state,
    defaultHouseholdId: row.default_household_id,
    lifecycleStatus: row.lifecycle_status,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function mapSessionRow(row: SessionRow): AuthSession {
  return {
    sessionId: row.id,
    userId: row.user_id,
    phoneNumberMasked: row.phone_number_masked,
    authState: row.auth_state,
    defaultHouseholdId: row.default_household_id,
    lifecycleStatus: row.lifecycle_status,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function toAppUser(user: UserRecord): AppUser {
  return {
    id: user.id,
    phoneNumberMasked: user.phoneNumberMasked,
    email: user.email,
    displayName: user.displayName,
    authProvider: user.authProvider,
    authState: user.authState,
    defaultHouseholdId: user.defaultHouseholdId,
    lifecycleStatus: user.lifecycleStatus,
    createdAt: user.createdAt,
  }
}
