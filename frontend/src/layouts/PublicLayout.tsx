import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import type { Breakpoint } from '@mui/material/styles'
import type { PropsWithChildren } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingHeader } from '../components/marketing/MarketingSections'

type PublicLayoutProps = PropsWithChildren<{
  maxWidth?: Breakpoint | false
  showMarketingNav?: boolean
}>

function CompactPublicHeader() {
  return (
    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
      <Typography
        color="text.primary"
        component={RouterLink}
        sx={{ fontWeight: 800, textDecoration: 'none' }}
        to="/"
        variant="h6"
      >
        SubSense
      </Typography>
      <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }} variant="body2">
        Recurring intelligence
      </Typography>
    </Toolbar>
  )
}

export function PublicLayout({
  children,
  maxWidth = 'sm',
  showMarketingNav = false,
}: PublicLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: showMarketingNav ? '#ffffff' : 'background.default',
      }}
    >
      {showMarketingNav ? (
        <AppBar color="inherit" elevation={0} position="sticky" sx={{ bgcolor: 'background.paper' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <MarketingHeader />
            </Toolbar>
          </Container>
        </AppBar>
      ) : (
        <AppBar color="transparent" elevation={0} position="static">
          <Container maxWidth={maxWidth}>
            <CompactPublicHeader />
          </Container>
        </AppBar>
      )}

      {showMarketingNav ? (
        <Box sx={{ pb: 8, pt: 1.25 }}>
          {children}
        </Box>
      ) : (
        <Container maxWidth={maxWidth} sx={{ pb: 8, pt: 2 }}>
          {children}
        </Container>
      )}
    </Box>
  )
}
