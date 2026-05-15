import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
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

const funnelEntries = (analytics: Record<string, number>) =>
  Object.entries(analytics).sort(([a], [b]) => a.localeCompare(b))

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

  const entries = launchQuery.data ? funnelEntries(launchQuery.data.analytics) : []
  const midpoint = Math.ceil(entries.length / 2)
  const leftColumn = entries.slice(0, midpoint)
  const rightColumn = entries.slice(midpoint)

  return (
    <AppLayout maxContainerWidth="lg">
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
              <Chip
                color="secondary"
                icon={<AssessmentRoundedIcon />}
                label="M6 internal launch readiness"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Button
                disabled={launchQuery.isFetching}
                onClick={() => void launchQuery.refetch()}
                size="small"
                startIcon={<RefreshRoundedIcon />}
                variant="outlined"
              >
                {launchQuery.isFetching ? 'Refreshing…' : 'Refresh snapshot'}
              </Button>
            </Stack>

            <Typography variant="h2">Operations and funnel snapshot</Typography>

            <Typography color="text.secondary" component="div" variant="body2">
              Funnel event counts (from <Box component="span" sx={{ fontFamily: 'monospace' }}>analytics_events</Box>
              ), notification row totals, and worker queue depth. Scroll this page for{' '}
              <strong>notifications</strong> and <strong>queues</strong> — they sit below the funnel list.
            </Typography>

            {import.meta.env.PROD ? (
              <Alert severity="warning" variant="outlined">
                <Typography component="div" variant="body2">
                  Production: set matching <Box component="span" sx={{ fontFamily: 'monospace' }}>INTERNAL_OPS_TOKEN</Box>{' '}
                  (API) and <Box component="span" sx={{ fontFamily: 'monospace' }}>VITE_INTERNAL_OPS_TOKEN</Box> (web build)
                  so requests send <Box component="span" sx={{ fontFamily: 'monospace' }}>x-internal-ops-token</Box>.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" variant="outlined">
                <Typography component="div" variant="body2">
                  Development: if <Box component="span" sx={{ fontFamily: 'monospace' }}>INTERNAL_OPS_TOKEN</Box> is set
                  in <Box component="span" sx={{ fontFamily: 'monospace' }}>.env</Box>, use the same value for{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>VITE_INTERNAL_OPS_TOKEN</Box> and restart{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>npm run dev</Box> so Vite embeds it.
                </Typography>
              </Alert>
            )}

            {launchQuery.isError ? (
              <Alert severity="error">
                Could not load launch readiness. If the API requires an ops token, align{' '}
                <Box component="span" sx={{ fontFamily: 'monospace' }}>INTERNAL_OPS_TOKEN</Box> and{' '}
                <Box component="span" sx={{ fontFamily: 'monospace' }}>VITE_INTERNAL_OPS_TOKEN</Box>, then restart dev servers.
              </Alert>
            ) : null}

            {launchQuery.isLoading ? (
              <Alert severity="info">Loading launch readiness…</Alert>
            ) : null}

            {launchQuery.data ? (
              <>
                <Typography color="text.secondary" variant="caption">
                  Last fetched: {new Date(launchQuery.dataUpdatedAt).toLocaleString()}
                </Typography>

                <Alert severity={launchQuery.data.status === 'healthy' ? 'success' : 'warning'}>
                  Overall status: {launchQuery.data.status}. Database: {launchQuery.data.services.database}. Redis:{' '}
                  {launchQuery.data.services.redis}.
                </Alert>

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Product funnel counts ({entries.length} metrics)
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
                  <Stack component="ul" spacing={0.5} sx={{ flex: 1, m: 0, minWidth: 0, pl: 2.5 }}>
                    {leftColumn.map(([name, count]) => (
                      <Typography key={name} component="li" color="text.secondary" variant="body2">
                        <Box component="span" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {name}
                        </Box>
                        : {count}
                      </Typography>
                    ))}
                  </Stack>
                  <Stack component="ul" spacing={0.5} sx={{ flex: 1, m: 0, minWidth: 0, pl: 2.5 }}>
                    {rightColumn.map(([name, count]) => (
                      <Typography key={name} component="li" color="text.secondary" variant="body2">
                        <Box component="span" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {name}
                        </Box>
                        : {count}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>

                <Divider />

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Notifications (operational)
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Total rows: {launchQuery.data.notifications.total}. In-app &quot;sent&quot; (unread-style) count:{' '}
                  {launchQuery.data.notifications.unread}.
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    maxHeight: 220,
                    overflow: 'auto',
                    p: 1.5,
                  }}
                >
                  {JSON.stringify(launchQuery.data.notifications.byChannel, null, 2)}
                </Box>

                <Divider />

                <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                  Queues (BullMQ)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    maxHeight: 280,
                    overflow: 'auto',
                    p: 1.5,
                  }}
                >
                  {JSON.stringify(launchQuery.data.queues, null, 2)}
                </Box>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
