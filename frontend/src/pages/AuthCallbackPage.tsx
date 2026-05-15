import { Alert, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { finalizeAuthenticatedSession } from '../lib/sessionBootstrap'
import { PublicLayout } from '../layouts/PublicLayout'

type DraftResponse = {
  data: {
    draft: {
      householdType: 'individual' | 'couple' | 'family' | 'shared_household' | null
    }
  }
}

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('sessionId')
  const error = searchParams.get('error')

  const draftQuery = useQuery({
    queryKey: ['session-draft'],
    queryFn: async () => {
      const response = await api.get<DraftResponse>('/v1/onboarding/draft')
      return response.data.data.draft
    },
  })

  const finalizeQuery = useQuery({
    queryKey: ['auth-callback-finalize', sessionId ?? 'none'],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Missing sessionId')
      }

      const sessionResponse = await api.get('/v1/auth/session', {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      })

      const sessionData = sessionResponse.data.data.session as {
        sessionId: string
        userId: string
        phoneNumberMasked: string
        defaultHouseholdId: string | null
      }

      await finalizeAuthenticatedSession(sessionData, draftQuery.data?.householdType ?? undefined)
      return true
    },
    enabled: Boolean(sessionId) && !error && draftQuery.isSuccess,
  })

  const errorMessage = useMemo(() => {
    if (error) {
      return 'Google sign-in did not complete. Try again from the session page.'
    }

    if (!sessionId) {
      return 'Missing session details from the identity provider.'
    }

    if (draftQuery.isError) {
      return 'We could not load your onboarding draft.'
    }

    if (finalizeQuery.isError) {
      return 'We could not finish signing you in. Check the backend logs and try again.'
    }

    return null
  }, [draftQuery.isError, error, finalizeQuery.isError, sessionId])

  useEffect(() => {
    if (finalizeQuery.isSuccess) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [finalizeQuery.isSuccess, navigate])

  return (
    <PublicLayout>
      <Card>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h2">Completing sign-in</Typography>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {!error && sessionId && (draftQuery.isLoading || finalizeQuery.isLoading) ? (
              <CircularProgress />
            ) : null}
            <Button component={RouterLink} to="/session" variant="outlined">
              Back to sign-in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
