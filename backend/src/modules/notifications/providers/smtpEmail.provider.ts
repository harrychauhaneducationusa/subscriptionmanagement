import { env } from '../../../config/env.js'
import { logger } from '../../../config/logger.js'
import { sendSmtpMail } from '../../../lib/mailer.js'
import type { EmailDeliveryResult, EmailMessage, EmailProviderAdapter } from './provider.types.js'

class SmtpEmailProviderAdapter implements EmailProviderAdapter {
  async sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
    const fromHeader = `"${env.EMAIL_FROM_NAME}" <${message.from}>`

    const { messageId } = await sendSmtpMail({
      to: message.to,
      from: fromHeader,
      subject: message.subject,
      text: message.text,
    })

    logger.info(
      {
        provider: 'smtp',
        providerMessageId: messageId,
        to: message.to,
        subject: message.subject,
        metadata: message.metadata,
      },
      'SMTP notification email sent',
    )

    return {
      provider: 'smtp',
      providerMessageId: messageId,
    }
  }
}

export const smtpEmailProviderAdapter = new SmtpEmailProviderAdapter()
