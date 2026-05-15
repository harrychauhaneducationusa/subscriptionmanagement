import { AppBar, Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import type { PropsWithChildren } from 'react'

export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar color="transparent" elevation={0} position="static">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Typography color="text.primary" sx={{ fontWeight: 800 }} variant="h6">
            SubSense AI
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Mobile-first recurring intelligence
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pb: 8 }}>
        <Stack spacing={3}>{children}</Stack>
      </Container>
    </Box>
  )
}
