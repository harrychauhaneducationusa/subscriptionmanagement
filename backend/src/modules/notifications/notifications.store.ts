import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { notificationActionCounter } from '../../config/metrics.js'
import { getDatabasePool } from '../../config/database.js'

export type NotificationType = 'renewal' | 'anomaly' | 'stale_link' | 'recommendation'
export type DeliveryState = 'queued' | 'sent' | 'failed' | 'read' | 'dismissed' | 'snoozed'
export type NotificationChannel = 'in_app' | 'email'

export type NotificationPreference = {
  id: string
  householdId: string
  userId: string
  inAppRecommendationEnabled: boolean
  inAppRenewalEnabled: boolean
  inAppStaleLinkEnabled: boolean
  emailRecommendationEnabled: boolean
  emailRenewalEnabled: boolean
  emailStaleLinkEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type Notification = {
  id: string
  householdId: string
  userId: string
  notificationType: NotificationType
  channel: NotificationChannel
  deliveryState: DeliveryState
  triggerEntityType: string
  triggerEntityId: string
  title: string
  message: string
  deepLink: string | null
  snoozedUntil: string | null
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationSpec = {
  notificationType: NotificationType
  triggerEntityType: string
  triggerEntityId: string
  title: string
  message: string
  deepLink: string | null
  channel?: NotificationChannel
}

type NotificationPreferenceRow = QueryResultRow & {
  id: string
  household_id: string
  user_id: string
  in_app_recommendation_enabled: boolean
  in_app_renewal_enabled: boolean
  in_app_stale_link_enabled: boolean
  email_recommendation_enabled: boolean
  email_renewal_enabled: boolean
  email_stale_link_enabled: boolean
  created_at: string | Date
  updated_at: string | Date
}

type NotificationRow = QueryResultRow & {
  id: string
  household_id: string
  user_id: string
  notification_type: NotificationType
  channel: NotificationChannel
  delivery_state: DeliveryState
  trigger_entity_type: string
  trigger_entity_id: string
  title: string
  message: string
  deep_link: string | null
  snoozed_until: string | Date | null
  read_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

const preferenceStore = new Map<string, NotificationPreference>()
const notificationStore = new Map<string, Notification>()

export async function getNotificationPreferences(householdId: string, userId: string) {
  const existing = await loadPreference(householdId, userId)

  if (existing) {
    return existing
  }

  const preference: NotificationPreference = {
    id: `npf_${randomUUID()}`,
    householdId,
    userId,
    inAppRecommendationEnabled: true,
    inAppRenewalEnabled: true,
    inAppStaleLinkEnabled: true,
    emailRecommendationEnabled: false,
    emailRenewalEnabled: false,
    emailStaleLinkEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await persistPreference(preference)
  return preference
}

export async function updateNotificationPreferences(
  householdId: string,
  userId: string,
  update: Partial<
    Pick<
      NotificationPreference,
      | 'inAppRecommendationEnabled'
      | 'inAppRenewalEnabled'
      | 'inAppStaleLinkEnabled'
      | 'emailRecommendationEnabled'
      | 'emailRenewalEnabled'
      | 'emailStaleLinkEnabled'
    >
  >,
) {
  const existing = await getNotificationPreferences(householdId, userId)
  const nextPreference: NotificationPreference = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  }

  await persistPreference(nextPreference)
  return nextPreference
}

export async function syncNotificationsForUser(
  householdId: string,
  userId: string,
  specs: NotificationSpec[],
) {
  const preferences = await getNotificationPreferences(householdId, userId)
  const enabledSpecs = specs
    .map((spec) => ({
      ...spec,
      channel: spec.channel ?? 'in_app',
    }))
    .filter((spec) => isSpecEnabled(preferences, spec))

  const existingNotifications = await loadNotificationsForUser(householdId, userId)
  const existingByKey = new Map(existingNotifications.map((notification) => [buildKey(notification), notification]))
  const desiredKeys = new Set<string>()
  const now = new Date()
  const queuedDispatchIds: string[] = []

  for (const spec of enabledSpecs) {
    const key = buildKey(spec)
    desiredKeys.add(key)
    const existing = existingByKey.get(key)

    if (!existing) {
      const createdNotification: Notification = {
        id: `ntf_${randomUUID()}`,
        householdId,
        userId,
        notificationType: spec.notificationType,
        channel: spec.channel,
        deliveryState: spec.channel === 'email' ? 'queued' : 'sent',
        triggerEntityType: spec.triggerEntityType,
        triggerEntityId: spec.triggerEntityId,
        title: spec.title,
        message: spec.message,
        deepLink: spec.deepLink,
        snoozedUntil: null,
        readAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }

      await persistNotification(createdNotification)

      if (createdNotification.channel === 'email') {
        queuedDispatchIds.push(createdNotification.id)
      }

      continue
    }

    const snoozedUntilActive =
      existing.deliveryState === 'snoozed' &&
      existing.snoozedUntil &&
      new Date(existing.snoozedUntil).getTime() > now.getTime()
    const contentChanged =
      existing.title !== spec.title ||
      existing.message !== spec.message ||
      existing.deepLink !== spec.deepLink
    const requeueEmailDispatch =
      existing.channel === 'email' &&
      !snoozedUntilActive &&
      existing.deliveryState !== 'dismissed' &&
      (existing.deliveryState === 'failed' || existing.deliveryState === 'queued')
    const nextNotification: Notification = {
      ...existing,
      title: spec.title,
      message: spec.message,
      deepLink: spec.deepLink,
      deliveryState:
        existing.deliveryState === 'dismissed'
          ? 'dismissed'
          : snoozedUntilActive
            ? 'snoozed'
            : existing.channel === 'email'
              ? requeueEmailDispatch
                ? 'queued'
                : existing.deliveryState === 'failed' && contentChanged
                  ? 'queued'
                  : existing.deliveryState
              : existing.deliveryState === 'read'
                ? 'read'
                : 'sent',
      snoozedUntil: snoozedUntilActive ? existing.snoozedUntil : null,
      updatedAt: now.toISOString(),
    }

    await persistNotification(nextNotification)

    if (nextNotification.channel === 'email' && nextNotification.deliveryState === 'queued') {
      queuedDispatchIds.push(nextNotification.id)
    }
  }

  for (const notification of existingNotifications) {
    if (!desiredKeys.has(buildKey(notification)) && notification.deliveryState !== 'dismissed') {
      await persistNotification({
        ...notification,
        deliveryState: 'dismissed',
        updatedAt: now.toISOString(),
      })
    }
  }

  return {
    queuedDispatchIds,
  }
}

/**
 * Lightweight unread count for nav badges. Does not run notification sync; open the inbox to refresh specs.
 */
export async function getUnreadInAppNotificationCount(householdId: string, userId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    const summary = await listNotificationsForUser(householdId, userId)
    return { unreadCount: summary.unreadCount }
  }

  const result = await pool.query<{ total: string }>(
    `
      select count(*)::int as total
      from notifications
      where household_id = $1
        and user_id = $2
        and channel = 'in_app'
        and delivery_state = 'sent'
    `,
    [householdId, userId],
  )

  return { unreadCount: Number(result.rows[0]?.total ?? 0) }
}

export async function listNotificationsForUser(householdId: string, userId: string) {
  const notifications = await loadNotificationsForUser(householdId, userId)
  const now = Date.now()
  const items = notifications
    .filter((notification) => {
      if (notification.deliveryState === 'dismissed') {
        return false
      }

      if (
        notification.deliveryState === 'snoozed' &&
        notification.snoozedUntil &&
        new Date(notification.snoozedUntil).getTime() > now
      ) {
        return false
      }

      return notification.channel === 'in_app'
    })
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

  return {
    items,
    unreadCount: items.filter((notification) => notification.deliveryState === 'sent').length,
  }
}

export async function markNotificationRead(householdId: string, userId: string, notificationId: string) {
  const notification = await getNotification(householdId, userId, notificationId)

  if (!notification) {
    return null
  }

  notificationActionCounter.inc({
    notification_type: notification.notificationType,
    action: 'read',
  })

  const nextNotification: Notification = {
    ...notification,
    deliveryState: 'read',
    readAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await persistNotification(nextNotification)
  return nextNotification
}

export async function dismissNotification(householdId: string, userId: string, notificationId: string) {
  const notification = await getNotification(householdId, userId, notificationId)

  if (!notification) {
    return null
  }

  notificationActionCounter.inc({
    notification_type: notification.notificationType,
    action: 'dismiss',
  })

  const nextNotification: Notification = {
    ...notification,
    deliveryState: 'dismissed',
    updatedAt: new Date().toISOString(),
  }

  await persistNotification(nextNotification)
  return nextNotification
}

export async function snoozeNotification(
  householdId: string,
  userId: string,
  notificationId: string,
  snoozeDays = 7,
) {
  const notification = await getNotification(householdId, userId, notificationId)

  if (!notification) {
    return null
  }

  notificationActionCounter.inc({
    notification_type: notification.notificationType,
    action: 'snooze',
  })

  const nextNotification: Notification = {
    ...notification,
    deliveryState: 'snoozed',
    snoozedUntil: new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await persistNotification(nextNotification)
  return nextNotification
}

export async function getNotificationOperationalSummary() {
  const pool = getDatabasePool()

  if (!pool) {
    const notifications = [...notificationStore.values()]
    const total = notifications.length
    const unread = notifications.filter(
      (notification) => notification.channel === 'in_app' && notification.deliveryState === 'sent',
    ).length

    return {
      total,
      unread,
      byChannel: summarizeNotifications(notifications),
    }
  }

  const totalResult = await pool.query<{ total: string }>('select count(*) as total from notifications')
  const unreadResult = await pool.query<{ total: string }>(
    `
      select count(*) as total
      from notifications
      where delivery_state = 'sent' and channel = 'in_app'
    `,
  )
  const groupedResult = await pool.query<{
    channel: NotificationChannel
    delivery_state: DeliveryState
    total: string
  }>(
    `
      select channel, delivery_state, count(*) as total
      from notifications
      group by channel, delivery_state
    `,
  )

  return {
    total: Number(totalResult.rows[0]?.total ?? 0),
    unread: Number(unreadResult.rows[0]?.total ?? 0),
    byChannel: groupedResult.rows.reduce<Record<string, Record<string, number>>>((accumulator, row) => {
      const channelSummary = accumulator[row.channel] ?? {}
      channelSummary[row.delivery_state] = Number(row.total)
      accumulator[row.channel] = channelSummary
      return accumulator
    }, {}),
  }
}

export async function getNotificationById(notificationId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return notificationStore.get(notificationId) ?? null
  }

  const result = await pool.query<NotificationRow>(
    `
      select *
      from notifications
      where id = $1
      limit 1
    `,
    [notificationId],
  )

  const row = result.rows[0]
  return row ? mapNotificationRow(row) : null
}

export async function markNotificationAsSent(notificationId: string, _providerMessageId?: string) {
  const notification = await getNotificationById(notificationId)

  if (!notification) {
    return null
  }

  const nextNotification: Notification = {
    ...notification,
    deliveryState: 'sent',
    updatedAt: new Date().toISOString(),
  }

  await persistNotification(nextNotification)
  return nextNotification
}

export async function markNotificationAsFailed(notificationId: string) {
  const notification = await getNotificationById(notificationId)

  if (!notification) {
    return null
  }

  const nextNotification: Notification = {
    ...notification,
    deliveryState: 'failed',
    updatedAt: new Date().toISOString(),
  }

  await persistNotification(nextNotification)
  return nextNotification
}

async function loadPreference(householdId: string, userId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return preferenceStore.get(`${householdId}:${userId}`) ?? null
  }

  const result = await pool.query<NotificationPreferenceRow>(
    `
      select *
      from notification_preferences
      where household_id = $1 and user_id = $2
      limit 1
    `,
    [householdId, userId],
  )

  const row = result.rows[0]
  return row ? mapPreferenceRow(row) : null
}

async function persistPreference(preference: NotificationPreference) {
  const pool = getDatabasePool()

  if (!pool) {
    preferenceStore.set(`${preference.householdId}:${preference.userId}`, preference)
    return preference
  }

  await pool.query(
    `
      insert into notification_preferences (
        id,
        household_id,
        user_id,
        in_app_recommendation_enabled,
        in_app_renewal_enabled,
        in_app_stale_link_enabled,
        email_recommendation_enabled,
        email_renewal_enabled,
        email_stale_link_enabled,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (household_id, user_id) do update set
        in_app_recommendation_enabled = excluded.in_app_recommendation_enabled,
        in_app_renewal_enabled = excluded.in_app_renewal_enabled,
        in_app_stale_link_enabled = excluded.in_app_stale_link_enabled,
        email_recommendation_enabled = excluded.email_recommendation_enabled,
        email_renewal_enabled = excluded.email_renewal_enabled,
        email_stale_link_enabled = excluded.email_stale_link_enabled,
        updated_at = excluded.updated_at
    `,
    [
      preference.id,
      preference.householdId,
      preference.userId,
      preference.inAppRecommendationEnabled,
      preference.inAppRenewalEnabled,
      preference.inAppStaleLinkEnabled,
      preference.emailRecommendationEnabled,
      preference.emailRenewalEnabled,
      preference.emailStaleLinkEnabled,
      preference.createdAt,
      preference.updatedAt,
    ],
  )

  return preference
}

async function loadNotificationsForUser(householdId: string, userId: string) {
  const pool = getDatabasePool()

  if (!pool) {
    return [...notificationStore.values()].filter(
      (notification) => notification.householdId === householdId && notification.userId === userId,
    )
  }

  const result = await pool.query<NotificationRow>(
    `
      select *
      from notifications
      where household_id = $1 and user_id = $2
    `,
    [householdId, userId],
  )

  return result.rows.map(mapNotificationRow)
}

async function getNotification(householdId: string, userId: string, notificationId: string) {
  const notifications = await loadNotificationsForUser(householdId, userId)
  return notifications.find((notification) => notification.id === notificationId) ?? null
}

async function persistNotification(notification: Notification) {
  const pool = getDatabasePool()

  if (!pool) {
    notificationStore.set(notification.id, notification)
    return notification
  }

  await pool.query(
    `
      insert into notifications (
        id,
        household_id,
        user_id,
        notification_type,
        channel,
        delivery_state,
        trigger_entity_type,
        trigger_entity_id,
        title,
        message,
        deep_link,
        snoozed_until,
        read_at,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      on conflict (user_id, channel, notification_type, trigger_entity_type, trigger_entity_id) do update set
        delivery_state = excluded.delivery_state,
        title = excluded.title,
        message = excluded.message,
        deep_link = excluded.deep_link,
        snoozed_until = excluded.snoozed_until,
        read_at = excluded.read_at,
        updated_at = excluded.updated_at
    `,
    [
      notification.id,
      notification.householdId,
      notification.userId,
      notification.notificationType,
      notification.channel,
      notification.deliveryState,
      notification.triggerEntityType,
      notification.triggerEntityId,
      notification.title,
      notification.message,
      notification.deepLink,
      notification.snoozedUntil,
      notification.readAt,
      notification.createdAt,
      notification.updatedAt,
    ],
  )

  return notification
}

function mapPreferenceRow(row: NotificationPreferenceRow): NotificationPreference {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    inAppRecommendationEnabled: row.in_app_recommendation_enabled,
    inAppRenewalEnabled: row.in_app_renewal_enabled,
    inAppStaleLinkEnabled: row.in_app_stale_link_enabled,
    emailRecommendationEnabled: row.email_recommendation_enabled,
    emailRenewalEnabled: row.email_renewal_enabled,
    emailStaleLinkEnabled: row.email_stale_link_enabled,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    notificationType: row.notification_type,
    channel: row.channel,
    deliveryState: row.delivery_state,
    triggerEntityType: row.trigger_entity_type,
    triggerEntityId: row.trigger_entity_id,
    title: row.title,
    message: row.message,
    deepLink: row.deep_link,
    snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until).toISOString() : null,
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function isSpecEnabled(preferences: NotificationPreference, spec: NotificationSpec & { channel: NotificationChannel }) {
  if (spec.channel === 'email') {
    switch (spec.notificationType) {
      case 'recommendation':
        return preferences.emailRecommendationEnabled
      case 'renewal':
        return preferences.emailRenewalEnabled
      case 'stale_link':
        return preferences.emailStaleLinkEnabled
      default:
        return false
    }
  }

  switch (spec.notificationType) {
    case 'recommendation':
      return preferences.inAppRecommendationEnabled
    case 'renewal':
      return preferences.inAppRenewalEnabled
    case 'stale_link':
      return preferences.inAppStaleLinkEnabled
    default:
      return true
  }
}

function buildKey(notification: Pick<Notification, 'notificationType' | 'triggerEntityType' | 'triggerEntityId' | 'channel'>) {
  return `${notification.channel}:${notification.notificationType}:${notification.triggerEntityType}:${notification.triggerEntityId}`
}

function summarizeNotifications(notifications: Notification[]) {
  return notifications.reduce<Record<string, Record<string, number>>>((accumulator, notification) => {
    const channelSummary = accumulator[notification.channel] ?? {}
    channelSummary[notification.deliveryState] = (channelSummary[notification.deliveryState] ?? 0) + 1
    accumulator[notification.channel] = channelSummary
    return accumulator
  }, {})
}
