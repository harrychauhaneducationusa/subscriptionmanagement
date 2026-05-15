import { listInstitutionLinks } from '../aggregation/aggregation.store.js'
import { getDashboardInsightData } from '../insights/insights.store.js'
import { enqueueNotificationDispatchJob } from './notifications.jobs.js'
import { syncNotificationsForUser, type NotificationSpec } from './notifications.store.js'

type RecommendationSignal = {
  id: string
  title: string
  message: string
}

type UpcomingRenewalSignal = {
  id: string
  kind: 'subscription' | 'utility'
  title: string
  nextOccurrenceAt: string | null
}

type LinkSignal = {
  id: string
  institutionName: string
  linkStatus: string
  lastFailureReason: string | null
}

export async function refreshNotificationsForUser(householdId: string, userId: string) {
  const [dashboardData, links] = await Promise.all([
    getDashboardInsightData(householdId),
    listInstitutionLinks(householdId),
  ])

  return syncNotificationCenterFromData({
    householdId,
    userId,
    recommendations: dashboardData.recommendations,
    upcomingRenewals: dashboardData.summary.upcomingRenewals,
    links,
  })
}

export async function syncNotificationCenterFromData(input: {
  householdId: string
  userId: string
  recommendations: RecommendationSignal[]
  upcomingRenewals: UpcomingRenewalSignal[]
  links: LinkSignal[]
}) {
  const result = await syncNotificationsForUser(
    input.householdId,
    input.userId,
    buildNotificationSpecs(input.recommendations, input.upcomingRenewals, input.links),
  )

  await Promise.all(
    result.queuedDispatchIds.map((notificationId) =>
      enqueueNotificationDispatchJob({
        type: 'notification.dispatch',
        notificationId,
      }),
    ),
  )

  return result
}

function buildNotificationSpecs(
  recommendations: RecommendationSignal[],
  upcomingRenewals: UpcomingRenewalSignal[],
  links: LinkSignal[],
) {
  const recommendationSpecs = recommendations.flatMap<NotificationSpec>((recommendation) =>
    buildChannelSpecs({
      notificationType: 'recommendation',
      triggerEntityType: 'recommendation',
      triggerEntityId: recommendation.id,
      title: recommendation.title,
      message: recommendation.message,
      deepLink: `/app/dashboard?focus=recommendation&target=${encodeURIComponent(recommendation.id)}`,
    }),
  )

  const renewalSpecs = upcomingRenewals
    .filter((renewal) => {
      if (!renewal.nextOccurrenceAt) {
        return false
      }

      return new Date(renewal.nextOccurrenceAt).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000
    })
    .flatMap<NotificationSpec>((renewal) =>
      buildChannelSpecs({
        notificationType: 'renewal',
        triggerEntityType: renewal.kind,
        triggerEntityId: renewal.id,
        title: `${renewal.title} is coming up`,
        message: renewal.nextOccurrenceAt
          ? `${renewal.title} is due on ${new Date(renewal.nextOccurrenceAt).toLocaleDateString()}.`
          : `${renewal.title} needs a due date review.`,
        deepLink: `/app/dashboard?focus=renewal&target=${encodeURIComponent(renewal.id)}&kind=${encodeURIComponent(renewal.kind)}`,
      }),
    )

  const staleLinkSpecs = links
    .filter((link) => ['failed', 'repair_required', 'disconnected'].includes(link.linkStatus))
    .flatMap<NotificationSpec>((link) =>
      buildChannelSpecs({
        notificationType: 'stale_link',
        triggerEntityType: 'institution_link',
        triggerEntityId: link.id,
        title: `${link.institutionName} needs attention`,
        message: link.lastFailureReason ?? 'Refresh or repair the bank connection to keep insights current.',
        deepLink: `/app/bank-link?focus=link&target=${encodeURIComponent(link.id)}`,
      }),
    )

  return [...recommendationSpecs, ...renewalSpecs, ...staleLinkSpecs]
}

function buildChannelSpecs(spec: Omit<NotificationSpec, 'channel'>) {
  return [
    {
      ...spec,
      channel: 'in_app' as const,
    },
    {
      ...spec,
      channel: 'email' as const,
    },
  ]
}
