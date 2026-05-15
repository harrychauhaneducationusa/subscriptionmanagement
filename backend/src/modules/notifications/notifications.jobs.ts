import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { queues } from '../../queues/registry.js'
import {
  getNotificationById,
  markNotificationAsFailed,
  markNotificationAsSent,
} from './notifications.store.js'
import {
  mockEmailProviderAdapter,
  resolveNotificationEmailRecipient,
} from './providers/mockEmail.provider.js'
import { smtpEmailProviderAdapter } from './providers/smtpEmail.provider.js'

function getNotificationEmailProvider() {
  if (env.NOTIFICATION_EMAIL_MODE === 'smtp') {
    return smtpEmailProviderAdapter
  }

  return mockEmailProviderAdapter
}

export type NotificationDispatchJob = {
  type: 'notification.dispatch'
  notificationId: string
}

export async function enqueueNotificationDispatchJob(job: NotificationDispatchJob) {
  if (queues.notificationDispatch) {
    await queues.notificationDispatch.add(job.type, job, {
      jobId: `notification_dispatch_${job.notificationId}`,
      removeOnComplete: 100,
      removeOnFail: 100,
    })

    return {
      accepted: true,
      mode: 'queued' as const,
    }
  }

  await processNotificationDispatchJob(job)

  return {
    accepted: true,
    mode: 'inline' as const,
  }
}

export async function processNotificationDispatchJob(job: NotificationDispatchJob) {
  logger.info({ jobType: job.type, notificationId: job.notificationId }, 'Processing notification dispatch job')

  const notification = await getNotificationById(job.notificationId)

  if (!notification) {
    logger.warn({ notificationId: job.notificationId }, 'Notification dispatch skipped because record was not found')
    return null
  }

  if (notification.channel !== 'email') {
    return notification
  }

  if (notification.deliveryState !== 'queued') {
    return notification
  }

  if (env.NOTIFICATION_EMAIL_MODE === 'disabled') {
    return markNotificationAsFailed(notification.id)
  }

  const recipient = resolveNotificationEmailRecipient(notification.userId)

  if (!recipient) {
    return markNotificationAsFailed(notification.id)
  }

  const result = await getNotificationEmailProvider().sendEmail({
    to: recipient,
    from: env.NOTIFICATION_EMAIL_FROM,
    subject: notification.title,
    text: `${notification.message}\n\nOpen: ${notification.deepLink ?? '/app/dashboard'}`,
    metadata: {
      notificationId: notification.id,
      householdId: notification.householdId,
      userId: notification.userId,
      notificationType: notification.notificationType,
    },
  })

  return markNotificationAsSent(notification.id, result.providerMessageId)
}
