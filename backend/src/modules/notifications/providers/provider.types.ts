import type { NotificationType } from '../notifications.store.js'

export type EmailMessage = {
  to: string
  from: string
  subject: string
  text: string
  metadata: {
    notificationId: string
    householdId: string
    userId: string
    notificationType: NotificationType
  }
}

export type EmailDeliveryResult = {
  provider: 'mock' | 'smtp'
  providerMessageId: string
}

export interface EmailProviderAdapter {
  sendEmail(message: EmailMessage): Promise<EmailDeliveryResult>
}
