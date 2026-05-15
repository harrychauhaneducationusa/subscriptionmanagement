import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getStoredSession } from '../lib/session'
import { AppLayout } from '../layouts/AppLayout'

type NotificationsResponse = {
  data: {
    items: Array<{
      id: string
      notificationType: 'renewal' | 'anomaly' | 'stale_link' | 'recommendation'
      deliveryState: 'queued' | 'sent' | 'failed' | 'read' | 'dismissed' | 'snoozed'
      title: string
      message: string
      deepLink: string | null
      createdAt: string
      updatedAt: string
    }>
    unreadCount: number
  }
}

type PreferencesResponse = {
  data: {
    preferences: {
      inAppRecommendationEnabled: boolean
      inAppRenewalEnabled: boolean
      inAppStaleLinkEnabled: boolean
      emailRecommendationEnabled: boolean
      emailRenewalEnabled: boolean
      emailStaleLinkEnabled: boolean
    }
  }
}

export function NotificationsPage() {
  const session = getStoredSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<NotificationsResponse>('/v1/notifications')
      return response.data.data
    },
    enabled: Boolean(session?.sessionId),
  })

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get<PreferencesResponse>('/v1/notification-preferences')
      return response.data.data.preferences
    },
    enabled: Boolean(session?.sessionId),
  })

  const invalidateNotifications = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    ])

  const readMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/v1/notifications/${notificationId}/read`)
    },
    onSuccess: invalidateNotifications,
  })

  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/v1/notifications/${notificationId}/dismiss`)
    },
    onSuccess: invalidateNotifications,
  })

  const snoozeMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/v1/notifications/${notificationId}/snooze`, {
        snoozeDays: 7,
      })
    },
    onSuccess: invalidateNotifications,
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (payload: Partial<PreferencesResponse['data']['preferences']>) => {
      await api.patch('/v1/notification-preferences', payload)
    },
    onSuccess: invalidateNotifications,
  })

  if (!session) {
    return <Navigate replace to="/session" />
  }

  return (
    <AppLayout>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Chip
              color="secondary"
              icon={<NotificationsRoundedIcon />}
              label="Stage 6 notifications and preferences"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Typography variant="h2">Notification inbox</Typography>
            <Typography color="text.secondary" variant="body2">
              Track recommendation alerts, upcoming renewals, and connection issues in one place.
            </Typography>
            <Chip
              color={notificationsQuery.data?.unreadCount ? 'primary' : 'default'}
              label={`Unread notifications: ${notificationsQuery.data?.unreadCount ?? 0}`}
              sx={{ alignSelf: 'flex-start' }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h2">Preferences</Typography>
            <Typography color="text.secondary" variant="body2">
              Control which reminders appear in-app now and which ones are email-ready for later.
            </Typography>
            <Alert severity="info">
              Email delivery uses the notification worker and the configured sandbox recipient in
              development.
            </Alert>

            {preferencesQuery.data ? (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.inAppRecommendationEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          inAppRecommendationEnabled: checked,
                        })
                      }
                    />
                  }
                  label="In-app recommendation alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.inAppRenewalEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          inAppRenewalEnabled: checked,
                        })
                      }
                    />
                  }
                  label="In-app renewal reminders"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.inAppStaleLinkEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          inAppStaleLinkEnabled: checked,
                        })
                      }
                    />
                  }
                  label="In-app stale bank-link alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.emailRecommendationEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          emailRecommendationEnabled: checked,
                        })
                      }
                    />
                  }
                  label="Email recommendation alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.emailRenewalEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          emailRenewalEnabled: checked,
                        })
                      }
                    />
                  }
                  label="Email renewal reminders"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesQuery.data.emailStaleLinkEnabled}
                      onChange={(_, checked) =>
                        updatePreferencesMutation.mutate({
                          emailStaleLinkEnabled: checked,
                        })
                      }
                    />
                  }
                  label="Email stale bank-link alerts"
                />
              </>
            ) : (
              <Alert severity="info">Loading notification preferences...</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Inbox items</Typography>

            {notificationsQuery.data?.items.length ? (
              notificationsQuery.data.items.map((notification) => (
                <Alert
                  key={notification.id}
                  severity={notification.notificationType === 'stale_link' ? 'warning' : 'info'}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {notification.title}
                      </Typography>
                      <Chip label={notification.deliveryState} size="small" />
                    </Stack>
                    <Typography variant="body2">{notification.message}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {new Date(notification.updatedAt).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        onClick={async () => {
                          await readMutation.mutateAsync(notification.id)
                          navigate(notification.deepLink ?? '/app/dashboard')
                        }}
                        size="small"
                        variant="contained"
                      >
                        Open
                      </Button>
                      <Button
                        onClick={() => readMutation.mutate(notification.id)}
                        size="small"
                        variant="outlined"
                      >
                        Mark read
                      </Button>
                      <Button
                        onClick={() => snoozeMutation.mutate(notification.id)}
                        size="small"
                        variant="outlined"
                      >
                        Snooze 7 days
                      </Button>
                      <Button
                        onClick={() => dismissMutation.mutate(notification.id)}
                        size="small"
                        variant="outlined"
                      >
                        Dismiss
                      </Button>
                    </Stack>
                  </Stack>
                </Alert>
              ))
            ) : (
              <Alert severity="info">
                No notifications are waiting right now. As recommendations, renewals, or bank-link
                issues appear, they will show up here.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
