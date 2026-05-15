import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded'
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded'
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
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getStoredSession } from '../lib/session'
import { AppLayout } from '../layouts/AppLayout'

type DashboardSummaryResponse = {
  data: {
    summary: {
      totalMonthlyRecurring: number
      activeItemCount: number
      categoriesTracked: number
      byCategory: Array<{
        category: string
        monthlyAmount: number
        itemCount: number
      }>
      sourceMix: {
        manualCount: number
        linkedCount: number
      }
      pendingCandidateCount: number
      openRecommendationCount: number
      duplicateIndicators: Array<{
        groupKey: string
        title: string
        itemCount: number
      }>
      topActions: Array<{
        id: string
        label: string
        count: number
        tone: 'info' | 'warning' | 'success'
      }>
      upcomingRenewals: Array<{
        id: string
        kind: 'subscription' | 'utility'
        title: string
        amount: number
        nextOccurrenceAt: string | null
        ownershipScope: 'personal' | 'shared'
      }>
    }
    recommendations: Array<{
      id: string
      title: string
      message: string
      recommendationType: 'cancel' | 'downgrade' | 'share' | 'bundle' | 'monitor'
      targetEntityType: 'subscription' | 'utility_bill' | 'household_bundle'
      targetEntityId: string
      estimatedMonthlyValue: number
      confidence: number
      assumptions: string[]
      status: 'open' | 'accepted' | 'dismissed' | 'snoozed' | 'expired'
    }>
    freshness: {
      message: string
    }
  }
}

type InsightFeedResponse = {
  data: {
    items: Array<{
      id: string
      insightType: string
      sourceRecommendationId: string | null
      generatedText: string
      freshnessStatus: string
      confidenceLabel: string | null
      generationMode: 'rules' | 'template' | 'ai_grounded'
    }>
  }
}

type RecurringListResponse = {
  data: {
    items: Array<{
      id: string
      kind: 'subscription' | 'utility'
      title: string
      providerName: string
      category: string
      amount: number
      normalizedMonthlyAmount: number
      cadence: string
      nextOccurrenceAt: string | null
      ownershipScope: 'personal' | 'shared'
      sourceType: 'manual' | 'detected' | 'merged'
      status: 'active' | 'paused' | 'cancelled'
    }>
  }
}

type CandidateListResponse = {
  data: {
    items: Array<{
      id: string
      candidateType: 'subscription' | 'utility' | 'other_recurring'
      displayName: string
      category: string
      confidenceScore: number
      reasonCodes: string[]
      suggestedAmount: number
      cadence: string
      ownershipScope: 'personal' | 'shared'
      suggestedNextOccurrenceAt: string | null
      reviewStatus: 'pending_review' | 'confirmed' | 'dismissed' | 'merged' | 'expired'
    }>
  }
}

type CandidateItem = CandidateListResponse['data']['items'][number]

type CandidateDraft = {
  displayName: string
  candidateType: 'subscription' | 'utility' | 'other_recurring'
  category: string
  suggestedAmount: string
  cadence: string
  ownershipScope: 'personal' | 'shared'
}

function candidateToDraft(candidate: CandidateItem): CandidateDraft {
  return {
    displayName: candidate.displayName,
    candidateType: candidate.candidateType,
    category: candidate.category,
    suggestedAmount: candidate.suggestedAmount.toString(),
    cadence: candidate.cadence,
    ownershipScope: candidate.ownershipScope,
  }
}

const subscriptionDefaults = {
  name: 'Netflix Premium',
  providerName: 'Netflix',
  category: 'streaming',
  amount: '649',
  cadence: 'monthly',
  nextRenewalAt: '',
  ownershipScope: 'personal',
}

const utilityDefaults = {
  providerName: 'Tata Power',
  category: 'utilities',
  typicalAmount: '1800',
  cadence: 'monthly',
  nextDueAt: '',
  ownershipScope: 'shared',
}

export function DashboardPage() {
  const session = getStoredSession()
  const queryClient = useQueryClient()
  const [subscriptionForm, setSubscriptionForm] = React.useState(subscriptionDefaults)
  const [utilityForm, setUtilityForm] = React.useState(utilityDefaults)
  const [candidateDraftEdits, setCandidateDraftEdits] = React.useState<
    Record<string, Partial<CandidateDraft>>
  >({})

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.get<DashboardSummaryResponse>('/v1/insights/dashboard-summary')
      return response.data.data
    },
    enabled: Boolean(session?.sessionId),
  })

  const feedQuery = useQuery({
    queryKey: ['insight-feed'],
    queryFn: async () => {
      const response = await api.get<InsightFeedResponse>('/v1/insights/feed')
      return response.data.data.items
    },
    enabled: Boolean(session?.sessionId),
  })

  const recurringQuery = useQuery({
    queryKey: ['recurring-items'],
    queryFn: async () => {
      const response = await api.get<RecurringListResponse>('/v1/recurring')
      return response.data.data.items
    },
    enabled: Boolean(session?.sessionId),
  })

  const candidateQuery = useQuery({
    queryKey: ['recurring-candidates'],
    queryFn: async () => {
      const response = await api.get<CandidateListResponse>('/v1/recurring/candidates')
      return response.data.data.items
    },
    enabled: Boolean(session?.sessionId),
  })

  const candidateDrafts = React.useMemo(() => {
    if (!candidateQuery.data) {
      return {} as Record<string, CandidateDraft>
    }

    return Object.fromEntries(
      candidateQuery.data.map((candidate) => [
        candidate.id,
        {
          ...candidateToDraft(candidate),
          ...candidateDraftEdits[candidate.id],
        },
      ]),
    )
  }, [candidateQuery.data, candidateDraftEdits])

  const invalidateRecurringAndInsights = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-items'] }),
      queryClient.invalidateQueries({ queryKey: ['insight-feed'] }),
    ])

  const invalidateCandidateAndInsights = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-items'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['insight-feed'] }),
    ])

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await api.post('/v1/recurring/subscriptions', {
        ...subscriptionForm,
        amount: Number(subscriptionForm.amount),
        nextRenewalAt: subscriptionForm.nextRenewalAt
          ? new Date(subscriptionForm.nextRenewalAt).toISOString()
          : null,
      })
    },
    onSuccess: async () => {
      setSubscriptionForm(subscriptionDefaults)
      await invalidateRecurringAndInsights()
    },
  })

  const createUtilityMutation = useMutation({
    mutationFn: async () => {
      await api.post('/v1/recurring/utilities', {
        ...utilityForm,
        typicalAmount: Number(utilityForm.typicalAmount),
        nextDueAt: utilityForm.nextDueAt ? new Date(utilityForm.nextDueAt).toISOString() : null,
      })
    },
    onSuccess: async () => {
      setUtilityForm(utilityDefaults)
      await invalidateRecurringAndInsights()
    },
  })

  const updateRecurringStatusMutation = useMutation({
    mutationFn: async (input: {
      id: string
      kind: 'subscription' | 'utility'
      nextStatus: 'active' | 'paused'
    }) => {
      const path =
        input.kind === 'subscription'
          ? `/v1/recurring/subscriptions/${input.id}`
          : `/v1/recurring/utilities/${input.id}`

      await api.patch(path, {
        status: input.nextStatus,
      })
    },
    onSuccess: async () => {
      await invalidateRecurringAndInsights()
    },
  })

  const saveCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const draft = candidateDrafts[candidateId]

      if (!draft) {
        return
      }

      await api.patch(`/v1/recurring/candidates/${candidateId}`, {
        displayName: draft.displayName,
        candidateType: draft.candidateType,
        category: draft.category,
        suggestedAmount: Number(draft.suggestedAmount),
        cadence: draft.cadence,
        ownershipScope: draft.ownershipScope,
      })
    },
    onSuccess: async () => {
      await invalidateCandidateAndInsights()
    },
  })

  const confirmCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      await api.post(`/v1/recurring/candidates/${candidateId}/confirm`, {})
    },
    onSuccess: async () => {
      await invalidateCandidateAndInsights()
    },
  })

  const dismissCandidateMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      await api.post(`/v1/recurring/candidates/${candidateId}/dismiss`, {})
    },
    onSuccess: async () => {
      await invalidateCandidateAndInsights()
    },
  })

  const mergeCandidateMutation = useMutation({
    mutationFn: async (input: { candidateId: string; targetRecurringId: string }) => {
      await api.post(`/v1/recurring/candidates/${input.candidateId}/merge`, {
        targetRecurringId: input.targetRecurringId,
      })
    },
    onSuccess: async () => {
      await invalidateCandidateAndInsights()
    },
  })

  const recommendationActionMutation = useMutation({
    mutationFn: async (input: {
      id: string
      action: 'accept' | 'dismiss' | 'snooze'
    }) => {
      await api.post(`/v1/insights/recommendations/${input.id}/action`, {
        action: input.action,
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['insight-feed'] }),
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
            <Stack spacing={0.75}>
              <Chip
                color="primary"
                icon={<AutorenewRoundedIcon />}
                label="Stage 5 actionable dashboard"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Typography variant="h2">Recurring intelligence with first actions</Typography>
              <Typography color="text.secondary" variant="body2">
                Manual entries, detected recurring items, pending review work, and grounded
                recommendations now combine into the first actionable dashboard for{' '}
                {session.householdName}.
              </Typography>
            </Stack>

            {summaryQuery.isError || recurringQuery.isError || candidateQuery.isError || feedQuery.isError ? (
              <Alert severity="error">
                The dashboard could not load. Make sure the API is running and the current session
                is still valid.
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Monthly recurring: Rs ${summaryQuery.data?.summary.totalMonthlyRecurring ?? 0}`}
              />
              <Chip label={`Active items: ${summaryQuery.data?.summary.activeItemCount ?? 0}`} />
              <Chip
                label={`Categories: ${summaryQuery.data?.summary.categoriesTracked ?? 0}`}
              />
              <Chip label={`Manual: ${summaryQuery.data?.summary.sourceMix.manualCount ?? 0}`} />
              <Chip label={`Linked: ${summaryQuery.data?.summary.sourceMix.linkedCount ?? 0}`} />
              <Chip
                label={`Pending review: ${summaryQuery.data?.summary.pendingCandidateCount ?? 0}`}
              />
              <Chip
                label={`Open recommendations: ${summaryQuery.data?.summary.openRecommendationCount ?? 0}`}
              />
            </Stack>

            {summaryQuery.data ? (
              <Alert severity="info">{summaryQuery.data.freshness.message}</Alert>
            ) : null}

            <Button
              component={RouterLink}
              startIcon={<AccountBalanceRoundedIcon />}
              to="/app/bank-link"
              variant="outlined"
            >
              Connect bank data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h2">Add a subscription</Typography>
              <Typography color="text.secondary" variant="body2">
                Create the first manual subscription records that power recurring totals and
                renewal visibility.
              </Typography>
            </Stack>

            <TextField
              label="Subscription name"
              onChange={(event) =>
                setSubscriptionForm((current) => ({ ...current, name: event.target.value }))
              }
              value={subscriptionForm.name}
            />
            <TextField
              label="Provider"
              onChange={(event) =>
                setSubscriptionForm((current) => ({ ...current, providerName: event.target.value }))
              }
              value={subscriptionForm.providerName}
            />
            <TextField
              label="Category"
              onChange={(event) =>
                setSubscriptionForm((current) => ({ ...current, category: event.target.value }))
              }
              value={subscriptionForm.category}
            />
            <TextField
              label="Amount (INR)"
              onChange={(event) =>
                setSubscriptionForm((current) => ({ ...current, amount: event.target.value }))
              }
              value={subscriptionForm.amount}
            />
            <TextField
              label="Cadence"
              onChange={(event) =>
                setSubscriptionForm((current) => ({ ...current, cadence: event.target.value }))
              }
              select
              value={subscriptionForm.cadence}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
            <TextField
              label="Next renewal"
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  nextRenewalAt: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={subscriptionForm.nextRenewalAt}
            />
            <TextField
              label="Ownership"
              onChange={(event) =>
                setSubscriptionForm((current) => ({
                  ...current,
                  ownershipScope: event.target.value,
                }))
              }
              select
              value={subscriptionForm.ownershipScope}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="shared">Shared</MenuItem>
            </TextField>

            <Button
              disabled={createSubscriptionMutation.isPending}
              onClick={() => createSubscriptionMutation.mutate()}
              startIcon={<AddCircleOutlineRoundedIcon />}
              variant="contained"
            >
              {createSubscriptionMutation.isPending ? 'Saving subscription...' : 'Add subscription'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h2">Add a utility bill</Typography>
              <Typography color="text.secondary" variant="body2">
                Keep utilities separate from streaming subscriptions so due dates and shared
                essentials stay visible.
              </Typography>
            </Stack>

            <TextField
              label="Provider"
              onChange={(event) =>
                setUtilityForm((current) => ({ ...current, providerName: event.target.value }))
              }
              value={utilityForm.providerName}
            />
            <TextField
              label="Category"
              onChange={(event) =>
                setUtilityForm((current) => ({ ...current, category: event.target.value }))
              }
              value={utilityForm.category}
            />
            <TextField
              label="Typical amount (INR)"
              onChange={(event) =>
                setUtilityForm((current) => ({ ...current, typicalAmount: event.target.value }))
              }
              value={utilityForm.typicalAmount}
            />
            <TextField
              label="Cadence"
              onChange={(event) =>
                setUtilityForm((current) => ({ ...current, cadence: event.target.value }))
              }
              select
              value={utilityForm.cadence}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="bi_monthly">Every 2 months</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </TextField>
            <TextField
              label="Next due date"
              onChange={(event) =>
                setUtilityForm((current) => ({ ...current, nextDueAt: event.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={utilityForm.nextDueAt}
            />
            <TextField
              label="Ownership"
              onChange={(event) =>
                setUtilityForm((current) => ({
                  ...current,
                  ownershipScope: event.target.value,
                }))
              }
              select
              value={utilityForm.ownershipScope}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="shared">Shared</MenuItem>
            </TextField>

            <Button
              disabled={createUtilityMutation.isPending}
              onClick={() => createUtilityMutation.mutate()}
              startIcon={<BoltRoundedIcon />}
              variant="contained"
            >
              {createUtilityMutation.isPending ? 'Saving utility...' : 'Add utility bill'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h2">Detected recurring review</Typography>
              <Typography color="text.secondary" variant="body2">
                Linked-account transactions now generate conservative recurring candidates with
                explainable reason codes. Review them before they become tracked recurring items.
              </Typography>
            </Stack>

            {candidateQuery.data?.length ? (
              candidateQuery.data.map((candidate, index) => {
                const draft = candidateDrafts[candidate.id]
                const mergeTarget = recurringQuery.data?.find((item) =>
                  candidate.candidateType === 'utility'
                    ? item.kind === 'utility'
                    : item.kind === 'subscription',
                )

                return (
                  <Stack key={candidate.id} spacing={1.5}>
                    {index > 0 ? <Divider /> : null}
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 700 }} variant="body1">
                          {candidate.displayName}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {candidate.candidateType} · confidence {Math.round(candidate.confidenceScore * 100)}%
                        </Typography>
                      </Stack>
                      <Chip
                        color={candidate.candidateType === 'utility' ? 'secondary' : 'primary'}
                        label={candidate.reviewStatus}
                      />
                    </Stack>

                    <Typography color="text.secondary" variant="body2">
                      Reason codes: {candidate.reasonCodes.join(', ')}
                    </Typography>

                    {draft ? (
                      <Stack spacing={1.25}>
                        <TextField
                          label="Display name"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                displayName: event.target.value,
                              },
                            }))
                          }
                          value={draft.displayName}
                        />
                        <TextField
                          label="Category"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                category: event.target.value,
                              },
                            }))
                          }
                          value={draft.category}
                        />
                        <TextField
                          label="Suggested amount"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                suggestedAmount: event.target.value,
                              },
                            }))
                          }
                          value={draft.suggestedAmount}
                        />
                        <TextField
                          label="Candidate type"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                candidateType: event.target.value as
                                  | 'subscription'
                                  | 'utility'
                                  | 'other_recurring',
                              },
                            }))
                          }
                          select
                          value={draft.candidateType}
                        >
                          <MenuItem value="subscription">Subscription</MenuItem>
                          <MenuItem value="utility">Utility</MenuItem>
                          <MenuItem value="other_recurring">Other recurring</MenuItem>
                        </TextField>
                        <TextField
                          label="Cadence"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                cadence: event.target.value,
                              },
                            }))
                          }
                          value={draft.cadence}
                        />
                        <TextField
                          label="Ownership"
                          onChange={(event) =>
                            setCandidateDraftEdits((current) => ({
                              ...current,
                              [candidate.id]: {
                                ...current[candidate.id],
                                ownershipScope: event.target.value as 'personal' | 'shared',
                              },
                            }))
                          }
                          select
                          value={draft.ownershipScope}
                        >
                          <MenuItem value="personal">Personal</MenuItem>
                          <MenuItem value="shared">Shared</MenuItem>
                        </TextField>
                      </Stack>
                    ) : null}

                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        onClick={() => saveCandidateMutation.mutate(candidate.id)}
                        variant="outlined"
                      >
                        Save edits
                      </Button>
                      <Button
                        onClick={() => confirmCandidateMutation.mutate(candidate.id)}
                        variant="contained"
                      >
                        Confirm candidate
                      </Button>
                      <Button
                        onClick={() => dismissCandidateMutation.mutate(candidate.id)}
                        variant="outlined"
                      >
                        Dismiss
                      </Button>
                      {mergeTarget ? (
                        <Button
                          onClick={() =>
                            mergeCandidateMutation.mutate({
                              candidateId: candidate.id,
                              targetRecurringId: mergeTarget.id,
                            })
                          }
                          variant="outlined"
                        >
                          Merge into {mergeTarget.title}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                )
              })
            ) : (
              <Alert severity="info">
                No recurring candidates are waiting for review yet. Link bank data and refresh a
                connection to generate candidates from normalized transactions.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h2">Recurring items</Typography>
              <Typography color="text.secondary" variant="body2">
                Review active manual recurring entries, their normalized monthly value, and the next
                action date.
              </Typography>
            </Stack>

            {recurringQuery.data?.length ? (
              recurringQuery.data.map((item, index) => (
                <Stack key={item.id} spacing={1.25}>
                  {index > 0 ? <Divider /> : null}
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 700 }} variant="body1">
                        {item.title}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {item.kind === 'subscription' ? 'Subscription' : 'Utility'} · {item.category}
                        {' · '}
                        {item.cadence}
                      </Typography>
                    </Stack>
                    <Chip
                      color={item.ownershipScope === 'shared' ? 'secondary' : 'default'}
                      label={item.ownershipScope}
                    />
                  </Stack>

                  <Typography color="text.secondary" variant="body2">
                    Rs {item.amount} billed, Rs {item.normalizedMonthlyAmount} monthly normalized
                    value. Next date: {item.nextOccurrenceAt ? new Date(item.nextOccurrenceAt).toLocaleDateString() : 'Not set'}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      color={item.status === 'active' ? 'success' : 'default'}
                      label={item.status}
                    />
                    <Button
                      onClick={() =>
                        updateRecurringStatusMutation.mutate({
                          id: item.id,
                          kind: item.kind,
                          nextStatus: item.status === 'active' ? 'paused' : 'active',
                        })
                      }
                      size="small"
                      startIcon={
                        item.status === 'active' ? (
                          <PauseCircleOutlineRoundedIcon />
                        ) : (
                          <PlayCircleOutlineRoundedIcon />
                        )
                      }
                      variant="outlined"
                    >
                      {item.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                  </Stack>
                </Stack>
              ))
            ) : (
              <Alert severity="info">
                No recurring items yet. Add a subscription or utility above to populate the first
                dashboard state.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {summaryQuery.data ? (
        <>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h2">Summary signals</Typography>

                <Stack spacing={1}>
                  {summaryQuery.data.summary.topActions.length ? (
                    summaryQuery.data.summary.topActions.map((entry) => (
                      <Chip
                        key={entry.id}
                        color={
                          entry.tone === 'warning'
                            ? 'warning'
                            : entry.tone === 'success'
                              ? 'success'
                              : 'default'
                        }
                        label={`${entry.label}: ${entry.count}`}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No urgent actions right now. The dashboard is caught up.
                    </Typography>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  {summaryQuery.data.summary.byCategory.map((entry) => (
                    <Typography key={entry.category} color="text.secondary" variant="body2">
                      {entry.category}: Rs {entry.monthlyAmount} monthly across {entry.itemCount}{' '}
                      item{entry.itemCount === 1 ? '' : 's'}
                    </Typography>
                  ))}
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  {summaryQuery.data.summary.upcomingRenewals.length ? (
                    summaryQuery.data.summary.upcomingRenewals.map((entry) => (
                      <Typography key={entry.id} color="text.secondary" variant="body2">
                        {entry.title} due on{' '}
                        {entry.nextOccurrenceAt
                          ? new Date(entry.nextOccurrenceAt).toLocaleDateString()
                          : 'date pending'}
                      </Typography>
                    ))
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No renewal dates are currently tracked.
                    </Typography>
                  )}
                </Stack>

                {summaryQuery.data.summary.duplicateIndicators.length ? (
                  <>
                    <Divider />
                    <Stack spacing={1}>
                      {summaryQuery.data.summary.duplicateIndicators.map((entry) => (
                        <Alert key={entry.groupKey} severity="warning">
                          {entry.title} appears {entry.itemCount} times in active recurring items.
                        </Alert>
                      ))}
                    </Stack>
                  </>
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h2">Savings recommendations</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Deterministic recommendations are generated from tracked recurring data before any
                    AI layer is introduced.
                  </Typography>
                </Stack>

                {summaryQuery.data.recommendations.length ? (
                  summaryQuery.data.recommendations.map((entry) => (
                    <Alert
                      key={entry.id}
                      severity={entry.recommendationType === 'monitor' ? 'warning' : 'info'}
                    >
                      <Stack spacing={1.25}>
                        <Stack spacing={0.35}>
                          <Typography sx={{ fontWeight: 700 }} variant="body2">
                            {entry.title}
                          </Typography>
                          <Typography variant="body2">{entry.message}</Typography>
                          <Typography color="text.secondary" variant="caption">
                            Estimated value: Rs {entry.estimatedMonthlyValue}/month · confidence{' '}
                            {Math.round(entry.confidence * 100)}%
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            Assumptions: {entry.assumptions.join(' ')}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          <Button
                            onClick={() =>
                              recommendationActionMutation.mutate({
                                id: entry.id,
                                action: 'accept',
                              })
                            }
                            size="small"
                            variant="contained"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() =>
                              recommendationActionMutation.mutate({
                                id: entry.id,
                                action: 'dismiss',
                              })
                            }
                            size="small"
                            variant="outlined"
                          >
                            Dismiss
                          </Button>
                          <Button
                            onClick={() =>
                              recommendationActionMutation.mutate({
                                id: entry.id,
                                action: 'snooze',
                              })
                            }
                            size="small"
                            variant="outlined"
                          >
                            Snooze
                          </Button>
                        </Stack>
                      </Stack>
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    No recommendations are open right now. Add more recurring data or review
                    existing items to refresh optimization opportunities.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h2">Insight feed</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Grounded insight events explain the latest dashboard state and why a
                    recommendation exists.
                  </Typography>
                </Stack>

                {feedQuery.data?.length ? (
                  feedQuery.data.map((entry) => (
                    <Alert key={entry.id} severity="info">
                      <Stack spacing={0.35}>
                        <Typography variant="body2">{entry.generatedText}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {entry.insightType} · {entry.generationMode} · {entry.confidenceLabel ?? 'n/a'} confidence
                        </Typography>
                      </Stack>
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    No insight events yet. As soon as recurring data or recommendations change, the
                    feed will explain what happened.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </>
      ) : null}
    </AppLayout>
  )
}
