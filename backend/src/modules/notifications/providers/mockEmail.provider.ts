import { randomUUID } from 'node:crypto'
import { env } from '../../../config/env.js'
import { logger } from '../../../config/logger.js'
import type { EmailDeliveryResult, EmailMessage, EmailProviderAdapter } from './provider.types.js'

class MockEmailProviderAdapter implements EmailProviderAdapter {
  async sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
    const providerMessageId = `mock_email_${randomUUID()}`

    logger.info(
      {
        provider: 'mock_email',
        providerMessageId,
        to: message.to,
        from: message.from,
        subject: message.subject,
        metadata: message.metadata,
      },
      'Mock email notification delivered',
    )

    return {
      provider: 'mock',
      providerMessageId,
    }
  }
}

export const mockEmailProviderAdapter = new MockEmailProviderAdapter()

export function resolveNotificationEmailRecipient(userId: string) {
  if (env.NOTIFICATION_EMAIL_MODE === 'disabled') {
    return null
  }

  return env.NOTIFICATION_EMAIL_TEST_RECIPIENT || `${userId}@sandbox.subsense.local`
}
