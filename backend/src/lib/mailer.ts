import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  return transporter
}

export async function sendEmailOtpMessage(input: { to: string; code: string }) {
  const fromAddress = env.EMAIL_FROM ?? env.NOTIFICATION_EMAIL_FROM

  const subject = 'Your SubSense verification code'
  const text = `Your verification code is ${input.code}. It expires in ${env.EMAIL_OTP_EXPIRY_MINUTES} minutes.`

  const transport = getTransporter()

  if (!transport) {
    if (env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured; cannot send email OTP in production')
    }

    logger.info(
      { to: input.to, code: input.code },
      'Email OTP (SMTP not configured — development log only)',
    )
    return { mode: 'logged' as const }
  }

  await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${fromAddress}>`,
    to: input.to,
    subject,
    text,
  })

  return { mode: 'sent' as const }
}

/** Sends a plain-text message using the same SMTP pool as email OTP. */
export async function sendSmtpMail(input: {
  to: string
  from: string
  subject: string
  text: string
}): Promise<{ messageId: string }> {
  const transport = getTransporter()

  if (!transport) {
    throw new Error('SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }

  const info = await transport.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  })

  const messageId = typeof info.messageId === 'string' && info.messageId.length > 0 ? info.messageId : `smtp_${randomUUID()}`

  return { messageId }
}
