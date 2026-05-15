import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import {
  Alert,
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
import { api } from '../lib/api'
import { getStoredSession } from '../lib/session'
import { AppLayout } from '../layouts/AppLayout'

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

const institutionOptions = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI']

export function BankLinkPage() {
  const session = getStoredSession()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [institutionName, setInstitutionName] = React.useState(institutionOptions[0])
  const consentId = searchParams.get('consentId')

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

  React.useEffect(() => {
    if (consentQuery.data) {
      void queryClient.invalidateQueries({ queryKey: ['institution-links'] })
    }
  }, [consentQuery.data, queryClient])

  const startConsentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ConsentResponse>('/v1/aggregation/consents', {
        institutionName,
        purpose: 'Analyze recurring subscriptions, utilities, and connection freshness.',
        scope: ['account_summary', 'transaction_history'],
      })

      return response.data.data
    },
    onSuccess: async (data) => {
      setSearchParams({ consentId: data.consent.id })
      await queryClient.invalidateQueries({ queryKey: ['institution-links'] })
    },
  })

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

  if (!session) {
    return <Navigate replace to="/session" />
  }

  return (
    <AppLayout>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Chip
              color="secondary"
              icon={<AccountBalanceRoundedIcon />}
              label="Stage 3 trust-forward linking"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Typography variant="h2">Connect bank data when you are ready</Typography>
            <Typography color="text.secondary" variant="body2">
              Linking is optional for phase 1. Manual recurring tracking continues to work if you
              skip this step, and you can retry later without losing household setup.
            </Typography>
            <Alert severity="info">
              This is a mocked Account Aggregator scaffold: the consent and link lifecycle is real
              inside the app, but the upstream provider flow is intentionally simulated for now.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h2">Start linking</Typography>
            <TextField
              label="Institution"
              onChange={(event) => setInstitutionName(event.target.value)}
              select
              value={institutionName}
            >
              {institutionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <Button
              disabled={startConsentMutation.isPending}
              onClick={() => startConsentMutation.mutate()}
              variant="contained"
            >
              {startConsentMutation.isPending ? 'Starting consent...' : 'Start bank-link consent'}
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
                  Consent session created. Use the provider callback buttons below to simulate
                  approval or failure from the bank-side flow.
                </Alert>
              ) : (
                <Alert severity={consentQuery.data.consent.status === 'active' ? 'success' : 'warning'}>
                  Consent for {consentQuery.data.consent.institutionName} is now{' '}
                  {consentQuery.data.consent.status}. Connection status:{' '}
                  {consentQuery.data.institutionLink?.linkStatus}.
                </Alert>
              )}

              {startConsentMutation.data?.redirect ? (
                <Alert severity="info">
                  Redirect target prepared for {startConsentMutation.data.redirect.provider_name}:{' '}
                  {startConsentMutation.data.redirect.redirect_url}
                </Alert>
              ) : null}

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
              Active and mocked bank links surface freshness and recovery actions without blocking
              the manual recurring flows already in the product.
            </Typography>

            {linksQuery.data?.empty_state === 'manual_only' ? (
              <Alert severity="info">
                No linked institutions yet. The app is currently operating in manual-only mode.
              </Alert>
            ) : null}

            {linksQuery.data?.links.map((link, index) => (
              <Stack key={link.id} spacing={1.25}>
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
                  {transaction.category} · Rs {transaction.amount} ·{' '}
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
