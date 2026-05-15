import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import Badge from '@mui/material/Badge'
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import type { Breakpoint } from '@mui/material/styles'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { clearStoredSession, getStoredSession } from '../lib/session'

type UnreadSummaryResponse = {
  data: {
    unreadCount: number
  }
}

type AppLayoutProps = PropsWithChildren<{
  /** Default keeps app screens mobile-narrow; use `lg` on Ops for wide tables. */
  maxContainerWidth?: Breakpoint | false
}>

export function AppLayout({ children, maxContainerWidth = 'sm' }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getStoredSession()
  const showOpsNav =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_OPS_NAV === 'true'

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-summary'],
    queryFn: async () => {
      const response = await api.get<UnreadSummaryResponse>('/v1/notifications/unread-summary')
      return response.data.data.unreadCount
    },
    enabled: Boolean(session?.sessionId),
    staleTime: 25_000,
    refetchOnWindowFocus: true,
  })

  const unread = unreadQuery.data ?? 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar color="transparent" elevation={0} position="sticky">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1, bgcolor: 'rgba(244,247,251,0.92)' }}>
          <Stack spacing={1}>
            <Typography color="text.primary" sx={{ fontWeight: 800 }} variant="h6">
              SubSense AI
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                color={location.pathname === '/app/dashboard' ? 'primary' : 'inherit'}
                component={RouterLink}
                size="small"
                to="/app/dashboard"
                variant={location.pathname === '/app/dashboard' ? 'contained' : 'outlined'}
              >
                Dashboard
              </Button>
              <Button
                color={location.pathname === '/app/bank-link' ? 'primary' : 'inherit'}
                component={RouterLink}
                size="small"
                to="/app/bank-link"
                variant={location.pathname === '/app/bank-link' ? 'contained' : 'outlined'}
              >
                Bank link
              </Button>
              <Badge
                color="primary"
                invisible={unread < 1}
                overlap="rectangular"
                badgeContent={unread > 99 ? '99+' : unread}
              >
                <Button
                  color={location.pathname === '/app/notifications' ? 'primary' : 'inherit'}
                  component={RouterLink}
                  size="small"
                  to="/app/notifications"
                  variant={location.pathname === '/app/notifications' ? 'contained' : 'outlined'}
                >
                  Notifications
                </Button>
              </Badge>
              {showOpsNav ? (
                <Button
                  color={location.pathname === '/app/ops' ? 'primary' : 'inherit'}
                  component={RouterLink}
                  size="small"
                  to="/app/ops"
                  variant={location.pathname === '/app/ops' ? 'contained' : 'outlined'}
                >
                  Ops
                </Button>
              ) : null}
            </Stack>
          </Stack>
          <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
            <Typography color="text.secondary" variant="caption">
              {session?.householdName ?? 'Active household'}
            </Typography>
            <Button
              endIcon={<LogoutRoundedIcon />}
              onClick={() => {
                clearStoredSession()
                navigate('/session')
              }}
              variant="outlined"
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth={maxContainerWidth} sx={{ pb: 8, pt: 2.5 }}>
        <Stack spacing={2.5}>{children}</Stack>
      </Container>
    </Box>
  )
}
