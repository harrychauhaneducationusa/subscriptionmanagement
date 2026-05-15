import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import type { PropsWithChildren } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { clearStoredSession, getStoredSession } from '../lib/session'

export function AppLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getStoredSession()

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
              <Button
                color={location.pathname === '/app/notifications' ? 'primary' : 'inherit'}
                component={RouterLink}
                size="small"
                to="/app/notifications"
                variant={location.pathname === '/app/notifications' ? 'contained' : 'outlined'}
              >
                Notifications
              </Button>
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

      <Container maxWidth="sm" sx={{ pb: 8, pt: 2.5 }}>
        <Stack spacing={2.5}>{children}</Stack>
      </Container>
    </Box>
  )
}
