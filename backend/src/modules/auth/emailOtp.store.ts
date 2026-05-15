import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { getDatabasePool } from '../../config/database.js'
import { hashEmailOtp, generateNumericOtp, verifyEmailOtpHash } from '../../lib/emailOtpCrypto.js'
import { sendEmailOtpMessage } from '../../lib/mailer.js'

type EmailOtpRow = QueryResultRow & {
  id: string
  email_normalized: string
  code_hash: string
  expires_at: string | Date
  consumed_at: string | Date | null
}

const memoryOtps = new Map<
  string,
  { id: string; emailNormalized: string; code: string; expiresAt: number }
>()

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function createEmailOtpChallenge(email: string) {
  const emailNormalized = normalizeEmail(email)
  const pool = getDatabasePool()

  const code =
    env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
      ? env.OTP_TEST_CODE
      : generateNumericOtp(6)

  const requestId = `eml_${randomUUID()}`
  const expiresAt = new Date(Date.now() + env.EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()
  const codeHash = hashEmailOtp(code)

  if (!pool) {
    memoryOtps.set(requestId, {
      id: requestId,
      emailNormalized,
      code,
      expiresAt: Date.parse(expiresAt),
    })

    return {
      requestId,
      devOtpHint: env.NODE_ENV === 'development' ? code : undefined,
      delivery: 'memory' as const,
    }
  }

  await pool.query(
    `
      insert into email_otp_requests (id, email_normalized, code_hash, expires_at)
      values ($1, $2, $3, $4)
    `,
    [requestId, emailNormalized, codeHash, expiresAt],
  )

  let delivery: 'sent' | 'logged' = 'logged'

  try {
    const result = await sendEmailOtpMessage({ to: emailNormalized, code })
    delivery = result.mode === 'sent' ? 'sent' : 'logged'
  } catch (error) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      logger.warn({ err: error, requestId }, 'Email OTP SMTP send failed; keeping challenge for dev verify')
      delivery = 'logged'
    } else {
      await pool.query(`delete from email_otp_requests where id = $1`, [requestId])
      throw error
    }
  }

  return {
    requestId,
    devOtpHint:
      env.NODE_ENV === 'development' || env.NODE_ENV === 'test' || delivery === 'logged'
        ? code
        : undefined,
    delivery,
  }
}

export async function consumeEmailOtpIfValid(input: {
  requestId: string
  email: string
  code: string
}): Promise<{ ok: true; emailNormalized: string } | { ok: false; reason: string }> {
  const emailNormalized = normalizeEmail(input.email)
  const pool = getDatabasePool()

  if (!pool) {
    const row = memoryOtps.get(input.requestId)

    if (!row || row.emailNormalized !== emailNormalized) {
      return { ok: false, reason: 'OTP_REQUEST_NOT_FOUND' }
    }

    if (Date.now() > row.expiresAt) {
      return { ok: false, reason: 'OTP_EXPIRED' }
    }

    if (row.code !== input.code) {
      return { ok: false, reason: 'OTP_INVALID' }
    }

    memoryOtps.delete(input.requestId)
    return { ok: true, emailNormalized }
  }

  const client = await pool.connect()

  try {
    await client.query('begin')

    const result = await client.query<EmailOtpRow>(
      `
        select id, email_normalized, code_hash, expires_at, consumed_at
        from email_otp_requests
        where id = $1
        for update
      `,
      [input.requestId],
    )

    const row = result.rows[0]

    if (!row || row.email_normalized !== emailNormalized) {
      await client.query('rollback')
      return { ok: false, reason: 'OTP_REQUEST_NOT_FOUND' }
    }

    if (row.consumed_at) {
      await client.query('rollback')
      return { ok: false, reason: 'OTP_ALREADY_USED' }
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await client.query('rollback')
      return { ok: false, reason: 'OTP_EXPIRED' }
    }

    if (!verifyEmailOtpHash(input.code, row.code_hash)) {
      await client.query('rollback')
      return { ok: false, reason: 'OTP_INVALID' }
    }

    await client.query(
      `
        update email_otp_requests
        set consumed_at = current_timestamp
        where id = $1
      `,
      [input.requestId],
    )

    await client.query('commit')
    return { ok: true, emailNormalized }
  } catch {
    await client.query('rollback')
    return { ok: false, reason: 'OTP_VERIFY_FAILED' }
  } finally {
    client.release()
  }
}
