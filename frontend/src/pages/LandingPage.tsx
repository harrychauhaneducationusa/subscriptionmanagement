import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import EastRoundedIcon from '@mui/icons-material/EastRounded'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'

const valuePoints = [
  'See subscriptions and recurring bills together',
  'Start manually before connecting bank data',
  'Stay ready for shared household tracking',
]

export function LandingPage() {
  return (
    <PublicLayout>
      <Card>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={3}>
            <Chip
              color="primary"
              label="Stage 1 foundation"
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            />
            <Stack spacing={1.5}>
              <Typography variant="h1">Understand your recurring spending before it surprises you.</Typography>
              <Typography color="text.secondary" variant="body1">
                SubSense AI helps you organize subscriptions, essential recurring bills, and
                household context in one premium mobile-first flow.
              </Typography>
            </Stack>

            <Stack spacing={1.25}>
              {valuePoints.map((valuePoint) => (
                <Stack direction="row" key={valuePoint} spacing={1} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlineRoundedIcon color="primary" fontSize="small" />
                  <Typography color="text.secondary" variant="body2">
                    {valuePoint}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              component={RouterLink}
              endIcon={<EastRoundedIcon />}
              size="large"
              to="/onboarding"
              variant="contained"
            >
              Start setup
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
