import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import { Alert, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getStoredSession } from '../lib/session'
import { AppLayout } from '../layouts/AppLayout'

type LaunchReadinessResponse = {
  data: {
    status: 'healthy' | 'degraded'
    services: {
      database: string
      redis: string
    }
    analytics: Record<string, number>
    notifications: {
      total: number
      unread: number
      byChannel: Record<string, Record<string, number>>
    }
    queues: Record<string, Record<string, number> | null>
  }
}

const internalOpsToken =
  typeof import.meta.env.VITE_INTERNAL_OPS_TOKEN === 'string'
    ? import.meta.env.VITE_INTERNAL_OPS_TOKEN
    : ''

export function OpsPage() {
  const session = getStoredSession()

  const launchQuery = useQuery({
    queryKey: ['internal-launch-readiness', internalOpsToken],
    queryFn: async () => {
      const response = await api.get<LaunchReadinessResponse>('/v1/internal/launch-readiness', {
        headers: internalOpsToken ? { 'x-internal-ops-token': internalOpsToken } : {},
      })
      return response.data.data
    },
    enabled: Boolean(session?.sessionId),
    retry: false,
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
              icon={<AssessmentRoundedIcon />}
              label="M6 internal launch readiness"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Typography variant="h2">Operations and funnel snapshot</Typography>
            <Typography color="text.secondary" variant="body2">
              Aggregate product analytics and queue depth for internal demos. In production, set{' '}
              <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
                INTERNAL_OPS_TOKEN
              </Typography>{' '}
              on the API and{' '}
              <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
                VITE_INTERNAL_OPS_TOKEN
              </Typography>{' '}
              in the web build so the browser sends matching{' '}
              <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
                x-internal-ops-token
              </Typography>
              .
            </Typography>

            {launchQuery.isError ? (
              <Alert severity="error">
                Could not load launch readiness. If you are in production, configure the shared ops
                token on both API and frontend, then reload.
              </Alert>
            ) : null}

            {launchQuery.isLoading ? (
              <Alert severity="info">Loading launch readiness…</Alert>
            ) : null}

            {launchQuery.data ? (
              <>
                <Alert severity={launchQuery.data.status === 'healthy' ? 'success' : 'warning'}>
                  Overall status: {launchQuery.data.status}. Database: {launchQuery.data.services.database}. Redis:{' '}
                  {launchQuery.data.services.redis}.
                </Alert>

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Product funnel counts
                </Typography>
                <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
                  {Object.entries(launchQuery.data.analytics)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, count]) => (
                      <Typography key={name} component="li" color="text.secondary" variant="body2">
                        <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
                          {name}
                        </Typography>
                        : {count}
                      </Typography>
                    ))}
                </Stack>

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Notifications (operational)
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Total rows: {launchQuery.data.notifications.total}. In-app unread-style sent count:{' '}
                  {launchQuery.data.notifications.unread}.
                </Typography>
                <Typography
                  color="text.secondary"
                  component="pre"
                  sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'auto' }}
                  variant="body2"
                >
                  {JSON.stringify(launchQuery.data.notifications.byChannel, null, 2)}
                </Typography>

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Queues
                </Typography>
                <Typography
                  color="text.secondary"
                  component="pre"
                  sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'auto' }}
                  variant="body2"
                >
                  {JSON.stringify(launchQuery.data.queues, null, 2)}
                </Typography>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
