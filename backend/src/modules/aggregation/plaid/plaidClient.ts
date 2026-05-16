import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type LinkTokenCreateRequest,
} from 'plaid'
import { env } from '../../../config/env.js'
import { ApiError } from '../../../lib/http.js'

export function getPlaidOAuthRedirectUri() {
  const configured = env.PLAID_OAUTH_REDIRECT_URI?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return null
}

function plaidBasePath() {
  return env.PLAID_ENV === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox
}

function parseProducts() {
  const names = env.PLAID_PRODUCTS.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const map: Record<string, Products> = {
    transactions: Products.Transactions,
    auth: Products.Auth,
    identity: Products.Identity,
    assets: Products.Assets,
  }

  const products = names.map((name) => map[name]).filter((value): value is Products => Boolean(value))

  if (products.length === 0) {
    return [Products.Transactions]
  }

  return products
}

function parseCountryCodes() {
  const codes = env.PLAID_COUNTRY_CODES.split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)

  const map: Record<string, CountryCode> = {
    US: CountryCode.Us,
    CA: CountryCode.Ca,
    GB: CountryCode.Gb,
  }

  const countries = codes.map((code) => map[code]).filter((value): value is CountryCode => Boolean(value))

  if (countries.length === 0) {
    return [CountryCode.Us]
  }

  return countries
}

export function assertPlaidConfigured() {
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) {
    throw new ApiError(
      503,
      'PLAID_NOT_CONFIGURED',
      'PLAID_CLIENT_ID and PLAID_SECRET are required when AGGREGATION_PROVIDER=plaid. Run npm run setup:plaid',
    )
  }
}

export function getPlaidApiClient() {
  assertPlaidConfigured()

  const configuration = new Configuration({
    basePath: plaidBasePath(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': env.PLAID_SECRET!,
      },
    },
  })

  return new PlaidApi(configuration)
}

function toPlaidApiError(error: unknown, fallbackCode: string, fallbackMessage: string): ApiError {
  const plaidError =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { error_code?: string; error_message?: string } } }).response
      ?.data === 'object'
      ? (error as { response: { data?: { error_code?: string; error_message?: string } } }).response.data
      : undefined

  const message = plaidError?.error_message ?? fallbackMessage
  const code = plaidError?.error_code ?? fallbackCode

  return new ApiError(502, code, message, {
    plaid_error_code: plaidError?.error_code ?? null,
    plaid_error_message: plaidError?.error_message ?? null,
  })
}

export async function createPlaidLinkToken(consentId: string) {
  const client = getPlaidApiClient()
  const redirectUri = getPlaidOAuthRedirectUri()
  const request: LinkTokenCreateRequest = {
    user: { client_user_id: consentId },
    client_name: 'SubSense',
    products: parseProducts(),
    country_codes: parseCountryCodes(),
    language: 'en',
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
  }

  try {
    const response = await client.linkTokenCreate(request)
    const linkToken = response.data.link_token

    if (!linkToken) {
      throw new ApiError(502, 'PLAID_LINK_TOKEN_FAILED', 'Plaid did not return a link_token')
    }

    return linkToken
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw toPlaidApiError(
      error,
      'PLAID_LINK_TOKEN_FAILED',
      'Plaid link token creation failed. Check PLAID_* credentials and optional PLAID_OAUTH_REDIRECT_URI.',
    )
  }
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const client = getPlaidApiClient()
  const response = await client.itemPublicTokenExchange({ public_token: publicToken })

  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  }
}

export async function testPlaidCredentials() {
  const token = await createPlaidLinkToken(`setup_test_${Date.now()}`)
  return { ok: true as const, linkTokenPrefix: token.slice(0, 12) }
}
