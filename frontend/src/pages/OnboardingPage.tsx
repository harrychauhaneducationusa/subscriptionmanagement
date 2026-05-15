import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { PublicLayout } from '../layouts/PublicLayout'

type DraftResponse = {
  data: {
    draft: {
      draftId: string
      householdMode: 'individual' | 'household' | null
      householdType: 'individual' | 'couple' | 'family' | 'shared_household' | null
      essentialRecurringItems: string[]
      seededSubscriptions: string[]
      lastUpdatedAt: string
    }
  }
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    householdMode: 'individual',
    householdType: 'individual',
    essentials: 'Electricity, Broadband',
    subscriptions: 'Netflix, Spotify',
  })

  const draftQuery = useQuery({
    queryKey: ['onboarding-draft'],
    queryFn: async () => {
      const response = await api.get<DraftResponse>('/v1/onboarding/draft')
      return response.data.data.draft
    },
  })

  const lastUpdatedAt = draftQuery.data?.lastUpdatedAt
  const draftUpdatedAt = useMemo(() => {
    if (!lastUpdatedAt) {
      return null
    }

    return new Date(lastUpdatedAt).toLocaleString()
  }, [lastUpdatedAt])

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        householdMode: formState.householdMode as 'individual' | 'household',
        householdType: formState.householdType as
          | 'individual'
          | 'couple'
          | 'family'
          | 'shared_household',
        essentialRecurringItems: formState.essentials
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        seededSubscriptions: formState.subscriptions
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }

      await api.patch('/v1/onboarding/draft', payload)
    },
    onSuccess: () => {
      navigate('/session')
    },
  })

  return (
    <PublicLayout>
      <Card>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Chip
                color="secondary"
                icon={<AutoAwesomeRoundedIcon />}
                label="Value before sensitive data"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Typography variant="h2">Build your recurring picture first</Typography>
              <Typography color="text.secondary" variant="body2">
                This foundation flow captures household context, essential recurring obligations,
                and a few known subscriptions before OTP and bank linking.
              </Typography>
            </Stack>

            {draftQuery.isLoading ? (
              <Stack sx={{ alignItems: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Who are you managing finances for?"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      householdMode: event.target.value,
                    }))
                  }
                  select
                  value={formState.householdMode}
                >
                  <MenuItem value="individual">Just me</MenuItem>
                  <MenuItem value="household">A household</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="Household type"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      householdType: event.target.value,
                    }))
                  }
                  select
                  value={formState.householdType}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="couple">Couple</MenuItem>
                  <MenuItem value="family">Family</MenuItem>
                  <MenuItem value="shared_household">Shared household</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  helperText="Comma-separated essentials keep the first dashboard meaningful."
                  label="Essential recurring items"
                  multiline
                  minRows={2}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      essentials: event.target.value,
                    }))
                  }
                  value={formState.essentials}
                />

                <TextField
                  fullWidth
                  helperText="Seed a few subscriptions so the dashboard is not empty."
                  label="Known subscriptions"
                  multiline
                  minRows={2}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      subscriptions: event.target.value,
                    }))
                  }
                  value={formState.subscriptions}
                />

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip icon={<FamilyRestroomRoundedIcon />} label="Household-aware by design" />
                  <Chip icon={<SavingsRoundedIcon />} label="Manual mode stays useful" />
                </Stack>
              </Stack>
            )}

            {draftUpdatedAt ? (
              <Alert severity="info">Last saved draft snapshot: {draftUpdatedAt}</Alert>
            ) : null}

            {saveDraftMutation.isError ? (
              <Alert severity="error">
                The draft could not be saved. Check that the backend is running and try again.
              </Alert>
            ) : null}

            <Button
              disabled={saveDraftMutation.isPending || draftQuery.isLoading}
              onClick={() => saveDraftMutation.mutate()}
              size="large"
              variant="contained"
            >
              {saveDraftMutation.isPending ? 'Saving draft...' : 'Continue to authentication'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
