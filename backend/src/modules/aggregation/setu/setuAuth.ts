import { env } from '../../../config/env.js'
import { ApiError } from '../../../lib/http.js'

type TokenCache = {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

function parseAccessToken(payload: Record<string, unknown>): { token: string; expiresIn: number } {
  const data = payload.data as Record<string, unknown> | undefined
  const token =
    (payload.accessToken as string | undefined) ??
    (payload.access_token as string | undefined) ??
    (data?.accessToken as string | undefined) ??
    (data?.access_token as string | undefined)

  const expiresIn = Number(
    payload.expiresIn ?? payload.expires_in ?? data?.expiresIn ?? data?.expires_in ?? 1800,
  )

  if (!token) {
    throw new ApiError(502, 'SETU_TOKEN_INVALID', 'Setu token response did not include an access token')
  }

  return { token, expiresIn }
}

export function assertSetuAaConfigured() {
  if (!env.SETU_AA_BASE_URL) {
    throw new ApiError(
      503,
      'SETU_AA_NOT_CONFIGURED',
      'SETU_AA_BASE_URL must be set when AGGREGATION_PROVIDER=setu',
    )
  }

  if (!env.SETU_AA_PRODUCT_INSTANCE_ID) {
    throw new ApiError(
      503,
      'SETU_AA_NOT_CONFIGURED',
      'SETU_AA_PRODUCT_INSTANCE_ID must be set when AGGREGATION_PROVIDER=setu',
    )
  }

  const hasStaticKey = Boolean(env.SETU_AA_API_KEY)
  const hasOAuth =
    Boolean(env.SETU_AA_CLIENT_ID) && Boolean(env.SETU_AA_CLIENT_SECRET) && Boolean(env.SETU_AA_TOKEN_URL)

  if (!hasStaticKey && !hasOAuth) {
    throw new ApiError(
      503,
      'SETU_AA_NOT_CONFIGURED',
      'Set SETU_AA_API_KEY or SETU_AA_CLIENT_ID + SETU_AA_CLIENT_SECRET + SETU_AA_TOKEN_URL',
    )
  }
}

export async function getSetuAccessToken(): Promise<string> {
  if (env.SETU_AA_API_KEY) {
    return env.SETU_AA_API_KEY
  }

  if (!env.SETU_AA_CLIENT_ID || !env.SETU_AA_CLIENT_SECRET || !env.SETU_AA_TOKEN_URL) {
    throw new ApiError(
      503,
      'SETU_AA_NOT_CONFIGURED',
      'Setu OAuth credentials are not configured',
    )
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }

  const response = await fetch(env.SETU_AA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientID: env.SETU_AA_CLIENT_ID,
      secret: env.SETU_AA_CLIENT_SECRET,
    }),
  })

  const rawText = await response.text()
  let json: Record<string, unknown>

  try {
    json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {}
  } catch {
    throw new ApiError(
      502,
      'SETU_TOKEN_INVALID',
      `Setu token response was not JSON (HTTP ${response.status})`,
    )
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      'SETU_TOKEN_FAILED',
      `Setu token HTTP ${response.status}: ${rawText.slice(0, 300)}`,
    )
  }

  const { token, expiresIn } = parseAccessToken(json)
  tokenCache = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  }

  return token
}

export async function buildSetuAaRequestHeaders(): Promise<Record<string, string>> {
  const accessToken = await getSetuAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-product-instance-id': env.SETU_AA_PRODUCT_INSTANCE_ID!,
  }

  if (env.SETU_AA_AUTH_HEADER.toLowerCase() === 'authorization') {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers[env.SETU_AA_AUTH_HEADER] = accessToken
  }

  return headers
}
