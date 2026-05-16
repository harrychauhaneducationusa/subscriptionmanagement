import GoogleIcon from '@mui/icons-material/Google'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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

type VerifyOtpResponse = {
  data: {
    session: {
      sessionId: string
      userId: string
      phoneNumberMasked: string
      defaultHouseholdId: string | null
    }
  }
}

const googleSignInEnabled = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export function SessionPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState('+919876543210')
  const [phoneOtp, setPhoneOtp] = useState('123456')
  const [email, setEmail] = useState('you@example.com')
  const [emailRequestId, setEmailRequestId] = useState<string | null>(null)
  const [emailOtp, setEmailOtp] = useState('123456')
  const [sessionSummary, setSessionSummary] = useState<{
    sessionId: string
    phoneNumberMasked: string
    householdName: string
  } | null>(null)

  const draftQuery = useQuery({
    queryKey: ['session-draft'],
    queryFn: async () => {
      const response = await api.get<DraftResponse>('/v1/onboarding/draft')
      return response.data.data.draft
    },
  })

  const completeSignIn = async (session: VerifyOtpResponse['data']['session']) => {
    const householdType = draftQuery.data?.householdType ?? undefined
    const { household } = await finalizeAuthenticatedSession(session, householdType)
    queryClient.clear()
    setSessionSummary({
      sessionId: session.sessionId,
      phoneNumberMasked: session.phoneNumberMasked,
      householdName: household.name,
    })
    navigate('/app/dashboard')
  }

  const signInMutation = useMutation({
    mutationFn: async () => {
      const otpRequest = await api.post('/v1/auth/request-otp', {
        phoneNumber,
      })

      const verifyResponse = await api.post<VerifyOtpResponse>('/v1/auth/verify-otp', {
        requestId: otpRequest.data.data.requestId,
        otp: phoneOtp,
      })

      return verifyResponse.data.data.session
    },
    onSuccess: async (session) => {
      await completeSignIn(session)
    },
  })

  const requestEmailOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/v1/auth/request-email-otp', { email })
      setEmailRequestId(response.data.data.requestId)
      return response.data.data
    },
  })

  const verifyEmailOtpMutation = useMutation({
    mutationFn: async () => {
      if (!emailRequestId) {
        throw new Error('Request an email code first')
      }

      const verifyResponse = await api.post<VerifyOtpResponse>('/v1/auth/verify-email-otp', {
        requestId: emailRequestId,
        email,
        otp: emailOtp,
      })

      return verifyResponse.data.data.session
    },
    onSuccess: async (session) => {
      await completeSignIn(session)
    },
  })

  const householdType = draftQuery.data?.householdType
  const authErrorDetail = useMemo(() => {
    const err =
      signInMutation.error ?? verifyEmailOtpMutation.error ?? requestEmailOtpMutation.error

    if (!err) {
      return null
    }

    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { error?: { code?: string; message?: string } } | undefined
      const code = body?.error?.code
      const message = body?.error?.message

      if (code || message) {
        return [code, message].filter(Boolean).join(' — ')
      }

      if (err.response?.status) {
        return `HTTP ${err.response.status}`
      }
    }

    return err instanceof Error ? err.message : String(err)
  }, [signInMutation.error, verifyEmailOtpMutation.error, requestEmailOtpMutation.error])

  const helperText = useMemo(() => {
    if (!householdType) {
      return 'Using the default individual household context.'
    }

    return `Household context selected earlier: ${householdType.replace('_', ' ')}`
  }, [householdType])

  return (
    <PublicLayout>
      <Card>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Chip
                color="primary"
                icon={<ShieldRoundedIcon />}
                label="Sign in"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Typography variant="h2">Save your setup securely</Typography>
              <Typography color="text.secondary" variant="body2">
                Sign in with phone OTP, email OTP, or Google. Phone OTP still uses the development
                test code when running locally.
              </Typography>
            </Stack>

            <Tabs onChange={(_, value) => setTab(value)} value={tab}>
              <Tab label="Phone OTP" />
              <Tab label="Email OTP" />
            </Tabs>

            {tab === 0 ? (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  helperText="Use a mobile-first identity model for phase 1."
                  label="Phone number"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  value={phoneNumber}
                />

                <TextField
                  fullWidth
                  helperText={`${helperText} The development OTP is 123456.`}
                  label="OTP code"
                  onChange={(event) => setPhoneOtp(event.target.value)}
                  value={phoneOtp}
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email address"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    disabled={requestEmailOtpMutation.isPending}
                    onClick={() => requestEmailOtpMutation.mutate()}
                    variant="outlined"
                  >
                    {requestEmailOtpMutation.isPending ? 'Sending…' : 'Send email code'}
                  </Button>
                </Stack>
                {requestEmailOtpMutation.data?.devOtpHint ? (
                  <Alert severity="info">
                    Development / SMTP fallback code: {String(requestEmailOtpMutation.data.devOtpHint)}
                  </Alert>
                ) : null}
                <TextField
                  fullWidth
                  helperText={
                    emailRequestId
                      ? 'Enter the code from your email (or the development hint above).'
                      : 'Send a code first.'
                  }
                  label="Email OTP"
                  onChange={(event) => setEmailOtp(event.target.value)}
                  value={emailOtp}
                />
              </Stack>
            )}

            {googleSignInEnabled ? (
              <>
                <Divider>or</Divider>
                <Button
                  fullWidth
                  href={`${apiBaseUrl}/v1/auth/google`}
                  rel="noopener"
                  startIcon={<GoogleIcon />}
                  variant="outlined"
                >
                  Continue with Google
                </Button>
              </>
            ) : null}

            {signInMutation.isError || verifyEmailOtpMutation.isError || requestEmailOtpMutation.isError ? (
              <Alert severity="error">
                {authErrorDetail ? (
                  <>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      Sign-in failed
                    </Typography>
                    <Typography sx={{ mt: 0.5 }} variant="body2">
                      {authErrorDetail}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                      If this mentions the database, run <Box component="span" sx={{ fontFamily: 'monospace' }}>npm run migrate -w backend</Box> from the repo root, then retry.
                    </Typography>
                  </>
                ) : (
                  'Authentication or household creation failed. Check the backend logs and try again.'
                )}
              </Alert>
            ) : null}

            {sessionSummary ? (
              <Alert severity="success">
                Session created for {sessionSummary.phoneNumberMasked}. Active household:
                {' '}
                {sessionSummary.householdName}. Session ID:
                {' '}
                {sessionSummary.sessionId}
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1.5}>
              <Button component={RouterLink} to="/onboarding" variant="outlined">
                Back
              </Button>
              {tab === 0 ? (
                <Button
                  disabled={signInMutation.isPending || draftQuery.isLoading}
                  onClick={() => signInMutation.mutate()}
                  variant="contained"
                >
                  {signInMutation.isPending ? 'Creating session…' : 'Verify OTP and create session'}
                </Button>
              ) : (
                <Button
                  disabled={verifyEmailOtpMutation.isPending || draftQuery.isLoading || !emailRequestId}
                  onClick={() => verifyEmailOtpMutation.mutate()}
                  variant="contained"
                >
                  {verifyEmailOtpMutation.isPending ? 'Creating session…' : 'Verify email and create session'}
                </Button>
              )}
            </Stack>

            {!googleSignInEnabled ? (
              <Typography color="text.secondary" variant="caption">
                Enable Google OAuth by setting <Box component="span" sx={{ fontFamily: 'monospace' }}>VITE_ENABLE_GOOGLE_OAUTH=true</Box> and configuring Google credentials on the API.
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </PublicLayout>
  )
}
