import { ApiError } from '../../../lib/http.js'
import { enqueueAggregationLifecycleJob } from '../aggregation.jobs.js'
import {
  getConsentState,
  processConsentCallback,
  setConsentPlaidCredentials,
  upsertPlaidBankAccounts,
} from '../aggregation.store.js'
import { exchangePlaidPublicToken, getPlaidApiClient } from './plaidClient.js'

export async function completePlaidLinkExchange(input: {
  householdId: string
  consentId: string
  publicToken: string
}) {
  const state = await getConsentState(input.householdId, input.consentId)

  if (!state) {
    throw new ApiError(404, 'CONSENT_NOT_FOUND', 'The consent session could not be found')
  }

  if (state.consent.provider !== 'plaid') {
    throw new ApiError(400, 'CONSENT_PROVIDER_MISMATCH', 'This consent is not a Plaid session')
  }

  const { accessToken, itemId } = await exchangePlaidPublicToken(input.publicToken)
  await setConsentPlaidCredentials(input.consentId, { itemId, accessToken })

  const client = getPlaidApiClient()
  const accountsResponse = await client.accountsGet({ access_token: accessToken })
  const accounts = accountsResponse.data.accounts.map((account) => ({
    accountId: account.account_id,
    name: account.name,
    mask: account.mask ?? null,
    subtype: account.subtype ?? account.type ?? null,
  }))

  const callbackResult = await processConsentCallback(input.consentId, 'consent.approved')

  if (callbackResult?.transition === 'applied') {
    await upsertPlaidBankAccounts({
      linkId: callbackResult.link.id,
      householdId: input.householdId,
      accounts,
    })

    await enqueueAggregationLifecycleJob({
      type: 'link.refresh',
      householdId: input.householdId,
      linkId: callbackResult.link.id,
    })
  }

  return {
    consent: callbackResult?.consent ?? state.consent,
    institutionLink: callbackResult?.link ?? state.link,
    itemId,
    accountsLinked: accounts.length,
  }
}
