import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const SIGNUP_ILLUSTRATION = '/marketing/signup-illustration.png'
const SIGNUP_STORAGE_KEY = 'subsense_signup_profile'

type SignupProfile = {
  firstName: string
  lastName: string
  email: string
}

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

function loadStoredSignup(): SignupProfile | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as SignupProfile
    if (
      typeof parsed?.firstName === 'string' &&
      typeof parsed?.lastName === 'string' &&
      typeof parsed?.email === 'string'
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function MarketingBullet({ children }: { children: React.ReactNode }) {
  return (
    <Stack alignItems="flex-start" direction="row" spacing={1.5}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: 'brand.main',
          mt: 0.6,
          flexShrink: 0,
        }}
      />
      <Typography color="text.secondary" sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
        {children}
      </Typography>
    </Stack>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const stored = loadStoredSignup()
  const [step, setStep] = useState<'signup' | 'draft'>(() => (stored ? 'draft' : 'signup'))

  const [signupForm, setSignupForm] = useState({
    firstName: stored?.firstName ?? '',
    lastName: stored?.lastName ?? '',
    email: stored?.email ?? '',
    agreed: false,
  })
  const [signupError, setSignupError] = useState<string | null>(null)

  const [formState, setFormState] = useState({
    householdMode: 'individual',
    householdType: 'individual',
    essentials: 'Electricity, Broadband',
    subscriptions: 'Netflix, Spotify',
  })

  const draftQuery = useQuery({
    queryKey: ['onboarding-draft'],
    enabled: step === 'draft',
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

  function handleSignupSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSignupError(null)

    const first = signupForm.firstName.trim()
    const last = signupForm.lastName.trim()
    const email = signupForm.email.trim()

    if (!first || !last || !email) {
      setSignupError('Please enter your first name, last name, and email.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSignupError('Please enter a valid email address.')
      return
    }

    if (!signupForm.agreed) {
      setSignupError('Please accept the terms to continue.')
      return
    }

    const profile: SignupProfile = { firstName: first, lastName: last, email }
    sessionStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(profile))
    setStep('draft')
  }

  const year = new Date().getFullYear()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#e8e8e8',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box component="main" sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5 }, px: 2 }}>
        <Container sx={{ maxWidth: 1080 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#ffffff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }}>
              <Box
                sx={{
                  flex: 1,
                  p: { xs: 3, md: 4 },
                  borderRight: { md: '1px solid' },
                  borderColor: { md: 'divider' },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  color="text.secondary"
                  component={RouterLink}
                  sx={{ mb: 2, fontSize: '0.85rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  to="/"
                >
                  ← Back to home
                </Typography>

                <Stack alignItems="center" direction="row" spacing={1.5} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'brand.main',
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontWeight: 800 }} variant="h6">
                    SubSense
                  </Typography>
                </Stack>

                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: '1.65rem', md: 'clamp(1.75rem, 2.5vw, 2.125rem)' },
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    mb: 2,
                  }}
                >
                  Easily see recurring subscriptions before they surprise you
                </Typography>

                <Typography color="text.secondary" sx={{ fontSize: '1rem', lineHeight: 1.6, mb: 3 }}>
                  SubSense brings bills, subscriptions, and household context into one place—with optional read-only bank
                  linking when you are ready.
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', fontWeight: 600, mb: 1.25 }}
                  variant="overline"
                >
                  With SubSense, you can also…
                </Typography>

                <Stack spacing={1.75} sx={{ mb: 4 }}>
                  <MarketingBullet>Track recurring spend and renewal timing at a glance</MarketingBullet>
                  <MarketingBullet>Get alerts before charges and when connections need attention</MarketingBullet>
                  <MarketingBullet>Link accounts on your terms—manual entry always works</MarketingBullet>
                </Stack>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Box
                    alt="SubSense illustration: tracking subscriptions and recurring spend"
                    component="img"
                    src={SIGNUP_ILLUSTRATION}
                    sx={{ width: '100%', maxWidth: 340, display: 'block', mx: { xs: 'auto', md: 0 } }}
                  />
                </Box>
              </Box>

              <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, bgcolor: '#fafafa' }}>
                {step === 'signup' ? (
                  <Paper
                    component="form"
                    elevation={0}
                    onSubmit={handleSignupSubmit}
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'rgba(0,0,0,0.08)',
                      bgcolor: '#ffffff',
                      maxWidth: 420,
                      mx: 'auto',
                    }}
                  >
                    <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.55, mb: 2.5 }}>
                      Create your SubSense profile. You will set up sign-in on the next step—this just saves how we should
                      greet you.
                    </Typography>

                    <Stack spacing={2}>
                      <TextField
                        autoComplete="given-name"
                        fullWidth
                        onChange={(e) => setSignupForm((s) => ({ ...s, firstName: e.target.value }))}
                        placeholder="First Name*"
                        required
                        value={signupForm.firstName}
                        variant="outlined"
                        sx={filledFieldSx}
                      />
                      <TextField
                        autoComplete="family-name"
                        fullWidth
                        onChange={(e) => setSignupForm((s) => ({ ...s, lastName: e.target.value }))}
                        placeholder="Last Name*"
                        required
                        value={signupForm.lastName}
                        variant="outlined"
                        sx={filledFieldSx}
                      />
                      <TextField
                        autoComplete="email"
                        fullWidth
                        onChange={(e) => setSignupForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder="Email Address*"
                        required
                        type="email"
                        value={signupForm.email}
                        variant="outlined"
                        sx={filledFieldSx}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={signupForm.agreed}
                            onChange={(e) => setSignupForm((s) => ({ ...s, agreed: e.target.checked }))}
                            sx={{ alignSelf: 'flex-start', pt: 0.25 }}
                          />
                        }
                        label={
                          <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                            I agree to the SubSense{' '}
                            <Link href="#" underline="hover">
                              Terms of Service
                            </Link>
                            ,{' '}
                            <Link href="#" underline="hover">
                              Privacy Policy
                            </Link>
                            , and consent to product emails about my account (placeholder links—replace with real legal
                            pages).
                          </Typography>
                        }
                        sx={{ alignItems: 'flex-start', mr: 0 }}
                      />

                      {signupError ? (
                        <Alert severity="error" sx={{ py: 0 }}>
                          {signupError}
                        </Alert>
                      ) : null}

                      <Button
                        fullWidth
                        size="large"
                        sx={{ borderRadius: 999, py: 1.25, fontWeight: 600 }}
                        type="submit"
                        variant="contained"
                      >
                        Get started
                      </Button>

                      <Typography align="center" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Already have an account?{' '}
                        <Link component={RouterLink} to="/session" underline="hover">
                          Log in
                        </Link>
                      </Typography>
                    </Stack>
                  </Paper>
                ) : (
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                      <Stack spacing={3}>
                        <Stack spacing={1}>
                          <Chip
                            color="secondary"
                            icon={<AutoAwesomeRoundedIcon />}
                            label="Hi from signup"
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          />
                          <Typography variant="h2">Build your recurring picture</Typography>
                          <Typography color="text.secondary" variant="body2">
                            Thanks{signupForm.firstName ? `, ${signupForm.firstName}` : ''}. Add household context and a
                            few subscriptions so the dashboard is useful before authentication and bank linking.
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
                              minRows={2}
                              multiline
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
                              minRows={2}
                              multiline
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

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <Button
                            color="inherit"
                            onClick={() => {
                              setStep('signup')
                              setSignupError(null)
                            }}
                            variant="outlined"
                          >
                            Edit profile
                          </Button>
                          <Button
                            disabled={saveDraftMutation.isPending || draftQuery.isLoading}
                            fullWidth
                            onClick={() => saveDraftMutation.mutate()}
                            size="large"
                            sx={{ borderRadius: 999, flex: 1 }}
                            variant="contained"
                          >
                            {saveDraftMutation.isPending ? 'Saving draft...' : 'Continue to authentication'}
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#e8e8e8',
        }}
      >
        <Container sx={{ maxWidth: 1080 }}>
          <Stack
            alignItems="center"
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography color="text.secondary" variant="caption">
              © {year} SubSense. All rights reserved.
            </Typography>
            <Stack
              alignItems="center"
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              spacing={2}
              useFlexGap
            >
              <Link color="text.secondary" href="#" underline="hover" variant="caption">
                Terms of Service
              </Link>
              <Link color="text.secondary" href="#" underline="hover" variant="caption">
                Privacy Policy
              </Link>
              <Link color="text.secondary" href="/learn" underline="hover" variant="caption">
                Learn
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

const filledFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#f3f4f6',
    borderRadius: 2,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.12)' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
  },
} as const
