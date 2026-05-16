import { Alert, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { api, getApiErrorMessage } from '../lib/api'
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
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('sessionId') ?? searchParams.get('session_id')
  const error = searchParams.get('error')

  /**
   * Google redirects here with ?sessionId=… before sessionStorage is populated.
   * Do not gate completion on /v1/onboarding/draft — that request is unrelated to OAuth and can
   * stall or fail independently, which previously left this page spinning forever.
   */
  const finalizeQuery = useQuery({
    queryKey: ['auth-callback-finalize', sessionId ?? 'none'],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Missing sessionId')
      }

      let householdType: 'individual' | 'couple' | 'family' | 'shared_household' | undefined
      try {
        const draftRes = await api.get<DraftResponse>('/v1/onboarding/draft')
        const t = draftRes.data.data.draft.householdType
        if (t === 'individual' || t === 'couple' || t === 'family' || t === 'shared_household') {
          householdType = t
        }
      } catch {
        householdType = undefined
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

      await finalizeAuthenticatedSession(sessionData, householdType)
      return true
    },
    enabled: Boolean(sessionId) && !error,
    retry: false,
  })

  const errorMessage = useMemo(() => {
    if (error) {
      return 'Google sign-in did not complete. Try again from the session page.'
    }

    if (!sessionId) {
      return 'Missing session details from the identity provider.'
    }

    if (finalizeQuery.isError) {
      return `We could not finish signing you in. ${getApiErrorMessage(finalizeQuery.error, 'Check the backend logs and try again.')}`
    }

    return null
  }, [error, finalizeQuery.error, finalizeQuery.isError, sessionId])

  useEffect(() => {
    if (!finalizeQuery.isSuccess) {
      return
    }

    void navigate('/app/dashboard', { replace: true })
    const clearId = window.setTimeout(() => {
      queryClient.clear()
    }, 0)

    return () => window.clearTimeout(clearId)
  }, [finalizeQuery.isSuccess, navigate, queryClient])

  const showSpinner = Boolean(sessionId) && !error && finalizeQuery.isPending

  return (
    <PublicLayout>
      <Card>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h2">Completing sign-in</Typography>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {showSpinner ? <CircularProgress /> : null}
            <Button component={RouterLink} to="/session" variant="outlined">
              Back to sign-in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
