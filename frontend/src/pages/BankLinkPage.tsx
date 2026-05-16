import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { api, getApiErrorMessage } from '../lib/api'
import { trackProductEvent } from '../lib/productAnalytics'
import { getStoredSession } from '../lib/session'
import { PlaidLinkLauncher } from '../components/PlaidLinkLauncher'
import { AppLayout } from '../layouts/AppLayout'
import { readPlaidLinkToken, storePlaidLinkToken } from '../lib/plaidLinkStorage'

type LinksResponse = {
  data: {
    links: Array<{
      id: string
      institutionName: string
      linkStatus: string
      lastSuccessfulSyncAt: string | null
      repairRequired: boolean
      freshness: {
        message: string
      }
    }>
    empty_state: 'manual_only' | null
  }
}

type RecentTransactionsResponse = {
  data: {
    items: Array<{
      id: string
      description: string
      category: string
      amount: number
      occurredAt: string
    }>
    empty_state: 'no_ingested_transactions' | null
  }
}

type ConsentResponse = {
  data: {
    consent: {
      id: string
      institutionName: string
      status: string
      purpose: string
      scope: string[]
    }
    redirect?: {
      provider_name: string
      redirect_url: string
      return_path: string
      status: string
      link_token?: string
    }
    institutionLink?: {
      id: string
      linkStatus: string
      lastFailureReason?: string | null
      freshness: {
        message: string
      }
    }
  }
}

const indiaInstitutionOptions = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI']
/** Plaid Link picks the real institution; this label is for SubSense records only. */
const PLAID_INSTITUTION_LABEL = 'US bank account (via Plaid)'

const aggregationProvider = import.meta.env.VITE_AGGREGATION_PROVIDER ?? 'mock'
const isPlaidMode = aggregationProvider === 'plaid'
const defaultInstitutionName = isPlaidMode ? PLAID_INSTITUTION_LABEL : indiaInstitutionOptions[0]

const showStageChips = import.meta.env.DEV || import.meta.env.VITE_SHOW_STAGE_CHIPS === 'true'

export function BankLinkPage() {
  const session = getStoredSession()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [institutionName, setInstitutionName] = React.useState(defaultInstitutionName)
  const [linkHighlightId, setLinkHighlightId] = React.useState<string | null>(null)
  const [plaidLinkToken, setPlaidLinkToken] = React.useState<string | null>(null)
  const [plaidError, setPlaidError] = React.useState<string | null>(null)
  const consentId = searchParams.get('consentId')
  const oauthStateId = searchParams.get('oauth_state_id')
  const isPlaidOAuthReturn = Boolean(oauthStateId && consentId)
  const receivedRedirectUri = isPlaidOAuthReturn ? window.location.href : undefined

  React.useEffect(() => {
    if (!session?.sessionId) {
      return
    }

    void trackProductEvent('bank_link.screen.view')
  }, [session?.sessionId])

  const linksQuery = useQuery({
    queryKey: ['institution-links'],
    queryFn: async () => {
      const response = await api.get<LinksResponse>('/v1/aggregation/links')
      return response.data.data
    },
    enabled: Boolean(session?.sessionId),
  })

  const recentTransactionsQuery = useQuery({
    queryKey: ['recent-linked-transactions'],
    queryFn: async () => {
      const response = await api.get<RecentTransactionsResponse>('/v1/transactions/recent')
      return response.data.data
    },
    enabled: Boolean(session?.sessionId),
  })

  const consentQuery = useQuery<ConsentResponse['data']>({
    queryKey: ['consent-state', consentId ?? 'none'],
    queryFn: async () => {
      const response = await api.get<ConsentResponse>(`/v1/aggregation/consents/${consentId}`)
      return response.data.data
    },
    enabled: Boolean(consentId && session?.sessionId),
  })

  const plaidLinkTokenQuery = useQuery({
    queryKey: ['plaid-link-token', consentId ?? 'none'],
    queryFn: async () => {
      const response = await api.get<{ data: { link_token: string } }>(
        `/v1/aggregation/consents/${consentId}/plaid-link-token`,
      )
      return response.data.data.link_token
    },
    enabled: Boolean(
      isPlaidMode &&
        consentId &&
        session?.sessionId &&
        (isPlaidOAuthReturn || consentQuery.data?.consent.status === 'pending_user_action'),
    ),
  })

  React.useEffect(() => {
    if (consentQuery.data) {
      void queryClient.invalidateQueries({ queryKey: ['institution-links'] })
    }
  }, [consentQuery.data, queryClient])

  React.useEffect(() => {
    const focus = searchParams.get('focus')
    const target = searchParams.get('target')

    if (focus !== 'link' || !target || !linksQuery.isSuccess || !linksQuery.data?.links.length) {
      return
    }

    const elementId = `bank-link-${target}`

    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(elementId)

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setLinkHighlightId(elementId)
        window.setTimeout(() => {
          setLinkHighlightId(null)
        }, 4500)
      }

      const next = new URLSearchParams(searchParams)
      next.delete('focus')
      next.delete('target')
      setSearchParams(next, { replace: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [linksQuery.isSuccess, linksQuery.data, linksQuery.dataUpdatedAt, searchParams, setSearchParams])

  const startConsentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ConsentResponse>('/v1/aggregation/consents', {
        institutionName: isPlaidMode ? PLAID_INSTITUTION_LABEL : institutionName,
        purpose: 'Analyze recurring subscriptions, utilities, and connection freshness.',
        scope: ['account_summary', 'transaction_history'],
      })

      return response.data.data
    },
    onSuccess: async (data) => {
      setSearchParams({ consentId: data.consent.id })
      setPlaidError(null)
      const token = data.redirect?.link_token ?? null
      if (token) {
        storePlaidLinkToken(data.consent.id, token)
      }
      setPlaidLinkToken(token)
      await queryClient.invalidateQueries({ queryKey: ['institution-links'] })
    },
  })

  const resolvedPlaidLinkToken =
    plaidLinkToken ??
    startConsentMutation.data?.redirect?.link_token ??
    (consentId ? readPlaidLinkToken(consentId) : null) ??
    plaidLinkTokenQuery.data ??
    null

  React.useEffect(() => {
    if (!isPlaidOAuthReturn || !consentId) {
      return
    }

    void queryClient.invalidateQueries({ queryKey: ['plaid-link-token', consentId] })
  }, [consentId, isPlaidOAuthReturn, queryClient])

  const callbackMutation = useMutation({
    mutationFn: async (eventType: 'consent.approved' | 'consent.failed') => {
      if (!consentId) {
        return null
      }

      await api.post(`/v1/aggregation/consents/${consentId}/mock-callback`, {
        eventType,
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['institution-links'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-linked-transactions'] }),
        consentId
          ? queryClient.invalidateQueries({ queryKey: ['consent-state', consentId] })
          : Promise.resolve(),
      ])
      await consentQuery.refetch()
    },
  })

  const refreshMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.post(`/v1/aggregation/links/${linkId}/refresh`)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['institution-links'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-linked-transactions'] }),
        consentId
          ? queryClient.invalidateQueries({ queryKey: ['consent-state', consentId] })
          : Promise.resolve(),
      ])
    },
  })

  const repairMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.post(`/v1/aggregation/links/${linkId}/repair`)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['institution-links'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-linked-transactions'] }),
        consentId
          ? queryClient.invalidateQueries({ queryKey: ['consent-state', consentId] })
          : Promise.resolve(),
      ])
    },
  })

  const handlePlaidComplete = React.useCallback(async () => {
    setPlaidLinkToken(null)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['institution-links'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-linked-transactions'] }),
      consentId
        ? queryClient.invalidateQueries({ queryKey: ['consent-state', consentId] })
        : Promise.resolve(),
    ])
    if (consentId) {
      await consentQuery.refetch()
    }
  }, [consentId, consentQuery, queryClient])

  if (!session) {
    return <Navigate replace to="/session" />
  }

  return (
    <AppLayout>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {showStageChips ? (
              <Chip
                color="secondary"
                icon={<AccountBalanceRoundedIcon />}
                label="Stage 3 trust-forward linking"
                sx={{ alignSelf: 'flex-start' }}
              />
            ) : null}
            <Typography variant="h2">Connect bank data when you are ready</Typography>
            <Typography color="text.secondary" variant="body2">
              Linking is optional for phase 1. Manual recurring tracking continues to work if you
              skip this step, and you can retry later without losing household setup.
            </Typography>
            <Alert severity="success" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
              <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
                Bank-level security posture
              </Typography>
              <Typography sx={{ mt: 0.5 }} variant="body2">
                Access follows explicit consent and stated purpose for recurring intelligence. Connections use
                encryption in transit; we do not use your credentials to move money or negotiate bills on your behalf.
                See the security architecture in the SubSense docs for full control objectives.
              </Typography>
            </Alert>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', py: 0.5 }}>
              {['Streaming', 'Utilities', 'Fitness', 'Cloud'].map((label) => (
                <Chip key={label} label={label} size="small" variant="outlined" />
              ))}
            </Stack>
            <Alert severity="info">
              {isPlaidMode
                ? 'US bank linking uses Plaid Sandbox. After starting consent, Plaid Link opens; use test credentials user_good / pass_good.'
                : 'Bank linking uses the configured aggregation provider (mock or Setu). Mock mode includes simulate-approval buttons below.'}
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Start linking</Typography>
            {isPlaidMode ? (
              <Alert severity="info">
                You will choose your bank inside Plaid Link (US Sandbox). SubSense stores a generic
                label until Plaid returns account details.
              </Alert>
            ) : (
              <TextField
                label="Institution"
                onChange={(event) => setInstitutionName(event.target.value)}
                select
                value={institutionName}
              >
                {indiaInstitutionOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {startConsentMutation.isError ? (
              <Alert severity="error">
                {getApiErrorMessage(
                  startConsentMutation.error,
                  'Could not start bank link. Check that the API is running and Plaid credentials are valid.',
                )}
              </Alert>
            ) : null}
            <Button
              disabled={startConsentMutation.isPending}
              onClick={() => startConsentMutation.mutate()}
              variant="contained"
            >
              {startConsentMutation.isPending
                ? 'Starting consent...'
                : isPlaidMode
                  ? 'Connect with Plaid'
                  : 'Start bank-link consent'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {consentId ? (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h2">Consent return flow</Typography>
              {!consentQuery.data ? (
                <Alert severity="info">
                  {isPlaidMode
                    ? 'Consent session created. Complete Plaid Link below to activate the connection.'
                    : 'Consent session created. Use the provider callback buttons below to simulate approval or failure from the bank-side flow.'}
                </Alert>
              ) : (
                <Alert severity={consentQuery.data.consent.status === 'active' ? 'success' : 'warning'}>
                  Consent for {consentQuery.data.consent.institutionName} is now{' '}
                  {consentQuery.data.consent.status}. Connection status:{' '}
                  {consentQuery.data.institutionLink?.linkStatus}.
                  {consentQuery.data.consent.status === 'pending_user_action' && isPlaidMode ? (
                    <>
                      {' '}
                      Plaid Link did not finish for this session — use Open Plaid Link below, or scroll to
                      Connection state for an already active link.
                    </>
                  ) : null}
                </Alert>
              )}

              {isPlaidOAuthReturn ? (
                <Alert severity="info">
                  Returning from your bank (OAuth). Click below to complete the connection in SubSense.
                </Alert>
              ) : null}

              {resolvedPlaidLinkToken && consentId && consentQuery.data?.consent.status !== 'active' ? (
                <Stack spacing={1}>
                  {plaidError ? <Alert severity="error">{plaidError}</Alert> : null}
                  <PlaidLinkLauncher
                    autoOpen={!isPlaidOAuthReturn}
                    consentId={consentId}
                    linkToken={resolvedPlaidLinkToken}
                    receivedRedirectUri={receivedRedirectUri}
                    onError={setPlaidError}
                    onSuccess={handlePlaidComplete}
                  />
                </Stack>
              ) : null}

              {startConsentMutation.data?.redirect?.redirect_url ? (
                <Alert severity="info">
                  Redirect prepared for {startConsentMutation.data.redirect.provider_name}:{' '}
                  <a href={startConsentMutation.data.redirect.redirect_url} rel="noreferrer" target="_blank">
                    Open provider flow
                  </a>
                </Alert>
              ) : null}

              {!isPlaidMode ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    disabled={callbackMutation.isPending}
                    onClick={() => callbackMutation.mutate('consent.approved')}
                    startIcon={<CheckCircleOutlineRoundedIcon />}
                    variant="outlined"
                  >
                    {callbackMutation.isPending ? 'Sending callback...' : 'Simulate provider approval'}
                  </Button>
                  <Button
                    disabled={callbackMutation.isPending}
                    onClick={() => callbackMutation.mutate('consent.failed')}
                    variant="outlined"
                  >
                    Simulate provider failure
                  </Button>
                </Stack>
              ) : null}

              <Button
                disabled={consentQuery.isFetching}
                onClick={() => consentQuery.refetch()}
                variant="text"
              >
                {consentQuery.isFetching ? 'Checking state...' : 'Refresh consent state'}
              </Button>

              {consentQuery.data ? (
                <Alert
                  severity={
                    consentQuery.data.institutionLink?.linkStatus === 'active' ? 'info' : 'warning'
                  }
                >
                  {consentQuery.data.institutionLink?.freshness.message}
                  {consentQuery.data.institutionLink?.lastFailureReason
                    ? ` ${consentQuery.data.institutionLink.lastFailureReason}`
                    : ''}
                </Alert>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Connection state</Typography>
            <Typography color="text.secondary" variant="body2">
              {isPlaidMode
                ? 'Linked US accounts show freshness and recovery actions. Older India-labelled links may remain from earlier mock or Setu tests.'
                : 'Active and mocked bank links surface freshness and recovery actions without blocking the manual recurring flows already in the product.'}
            </Typography>

            {linksQuery.data?.empty_state === 'manual_only' ? (
              <Alert severity="info">
                No linked institutions yet. The app is currently operating in manual-only mode.
              </Alert>
            ) : null}

            {linksQuery.data?.links.map((link, index) => (
              <Box
                id={`bank-link-${link.id}`}
                key={link.id}
                sx={
                  linkHighlightId === `bank-link-${link.id}`
                    ? {
                        borderRadius: 1,
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '6px',
                        px: 0.25,
                      }
                    : undefined
                }
              >
                <Stack spacing={1.25}>
                  {index > 0 ? <Divider /> : null}
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 700 }} variant="body1">
                      {link.institutionName}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Status: {link.linkStatus}
                    </Typography>
                  </Stack>
                  <Chip
                    color={link.linkStatus === 'active' ? 'success' : 'default'}
                    label={link.linkStatus}
                  />
                </Stack>

                <Typography color="text.secondary" variant="body2">
                  {link.freshness.message}
                  {link.lastSuccessfulSyncAt
                    ? ` Last sync: ${new Date(link.lastSuccessfulSyncAt).toLocaleString()}.`
                    : ''}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => refreshMutation.mutate(link.id)}
                    startIcon={<AutorenewRoundedIcon />}
                    variant="outlined"
                  >
                    Refresh
                  </Button>
                  <Button
                    onClick={() => repairMutation.mutate(link.id)}
                    startIcon={<BuildCircleRoundedIcon />}
                    variant="outlined"
                  >
                    Repair
                  </Button>
                </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Recent linked transactions</Typography>
            <Typography color="text.secondary" variant="body2">
              This is the first Stage 4 ingestion surface. Linked-account sync now produces raw and
              normalized transaction records for review.
            </Typography>

            {recentTransactionsQuery.data?.empty_state === 'no_ingested_transactions' ? (
              <Alert severity="info">
                No linked transactions have been ingested yet. Complete a consent callback or run a
                refresh on an active link to populate this view.
              </Alert>
            ) : null}

            {recentTransactionsQuery.data?.items.map((transaction, index) => (
              <Stack key={transaction.id} spacing={1}>
                {index > 0 ? <Divider /> : null}
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  {transaction.description}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {transaction.category} · {isPlaidMode ? '$' : 'Rs '}
                  {transaction.amount} ·{' '}
                  {new Date(transaction.occurredAt).toLocaleDateString()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
