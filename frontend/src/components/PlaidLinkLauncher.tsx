import { Button } from '@mui/material'
import { usePlaidLink } from 'react-plaid-link'
import * as React from 'react'
import { api } from '../lib/api'
import { clearPlaidLinkToken } from '../lib/plaidLinkStorage'

type PlaidLinkLauncherProps = {
  linkToken: string
  consentId: string
  receivedRedirectUri?: string
  autoOpen?: boolean
  onSuccess: () => void | Promise<void>
  onError?: (message: string) => void
}

export function PlaidLinkLauncher({
  linkToken,
  consentId,
  receivedRedirectUri,
  autoOpen = true,
  onSuccess,
  onError,
}: PlaidLinkLauncherProps) {
  const [isExchanging, setIsExchanging] = React.useState(false)
  const openedRef = React.useRef(false)

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri,
    onSuccess: async (publicToken) => {
      setIsExchanging(true)

      try {
        await api.post('/v1/aggregation/plaid/exchange', {
          consentId,
          publicToken,
        })
        clearPlaidLinkToken(consentId)
        await onSuccess()
      } catch (error) {
        const message =
          error instanceof Error && 'response' in error
            ? String((error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ??
                'Plaid Link succeeded but token exchange failed.')
            : 'Plaid Link succeeded but token exchange failed.'
        onError?.(message)
      } finally {
        setIsExchanging(false)
      }
    },
    onExit: (exitError, metadata) => {
      if (exitError) {
        onError?.(exitError.display_message ?? exitError.error_message ?? 'Plaid Link was closed')
        return
      }

      if (metadata.status === 'requires_credentials') {
        onError?.('Plaid Link closed before the bank connection finished. Click Open Plaid Link to try again.')
      }
    },
  })

  React.useEffect(() => {
    if (!autoOpen || !ready || openedRef.current) {
      return
    }

    openedRef.current = true
    open()
  }, [autoOpen, ready, open])

  return (
    <Button disabled={!ready || isExchanging} onClick={() => open()} variant="contained">
      {isExchanging
        ? 'Connecting account...'
        : receivedRedirectUri
          ? 'Complete Plaid connection'
          : ready
            ? 'Open Plaid Link'
            : 'Preparing Plaid Link...'}
    </Button>
  )
}
