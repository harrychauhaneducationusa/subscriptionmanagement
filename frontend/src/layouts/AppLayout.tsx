import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import type { PropsWithChildren } from 'react'
import type { Breakpoint } from '@mui/material/styles'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { clearStoredSession, getStoredSession } from '../lib/session'

const drawerWidth = 264

type UnreadSummaryResponse = {
  data: {
    unreadCount: number
  }
}

type AppLayoutProps = PropsWithChildren<{
  maxContainerWidth?: Breakpoint | false
}>

export function AppLayout({ children, maxContainerWidth = 'sm' }: AppLayoutProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
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
  const onDashboard = location.pathname === '/app/dashboard'
  const dashboardHome = onDashboard && location.hash !== '#recurring'
  const recurringFocus = onDashboard && location.hash === '#recurring'

  const drawer = (
    <Box sx={{ pt: 2, px: 1 }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ px: 1.5, mb: 2 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'brand.main' }} />
        <Typography sx={{ fontWeight: 800 }} variant="h6">
          SubSense
        </Typography>
      </Stack>
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            selected={dashboardHome}
            to="/app/dashboard"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            selected={recurringFocus}
            to="/app/dashboard#recurring"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AutorenewRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Recurring" secondary="Items & review" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            selected={location.pathname === '/app/bank-link'}
            to="/app/bank-link"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AccountBalanceRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Connect accounts" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            selected={location.pathname === '/app/notifications'}
            to="/app/notifications"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Badge color="primary" invisible={unread < 1} variant="dot">
                <NotificationsRoundedIcon fontSize="small" />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Alerts" secondary={unread > 0 ? `${unread} unread` : undefined} />
          </ListItemButton>
        </ListItem>
        {showOpsNav ? (
          <ListItem disablePadding>
            <ListItemButton
              component={RouterLink}
              selected={location.pathname === '/app/ops'}
              to="/app/ops"
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Ops" />
            </ListItemButton>
          </ListItem>
        ) : null}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          variant={isMdUp ? 'permanent' : 'temporary'}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar
          sx={{
            minHeight: 56,
            px: 2,
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {!isMdUp ? (
            <IconButton aria-label="open menu" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuRoundedIcon />
            </IconButton>
          ) : (
            <Box />
          )}
          <Typography color="text.secondary" sx={{ fontWeight: 500 }} variant="body2">
            {(() => {
              const h = new Date().getHours()
              const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
              return `${greet}${session?.householdName ? `, ${session.householdName}` : ''}`
            })()}
          </Typography>
          <Stack alignItems="center" direction="row" spacing={0.5}>
            <IconButton aria-label="settings placeholder" disabled size="small" title="Settings coming soon">
              <SettingsRoundedIcon fontSize="small" />
            </IconButton>
            <Button
              color="inherit"
              onClick={() => {
                queryClient.clear()
                clearStoredSession()
                navigate('/session')
              }}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>

        <Container maxWidth={maxContainerWidth} sx={{ pb: 8, pt: 2.5, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>{children}</Stack>
        </Container>
      </Box>
    </Box>
  )
}
