import { beforeEach, describe, expect, it, vi } from 'vitest'

const linkTokenCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { link_token: 'link-sandbox-from-test' } }),
)
const itemPublicTokenExchange = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { access_token: 'acc_t', item_id: 'item_t' } }),
)

const envStub = vi.hoisted(() => ({
  PLAID_CLIENT_ID: 'test_plaid_client',
  PLAID_SECRET: 'test_plaid_secret',
  PLAID_ENV: 'sandbox' as const,
  PLAID_PRODUCTS: 'transactions',
  PLAID_COUNTRY_CODES: 'US',
  PLAID_OAUTH_REDIRECT_URI: undefined as string | undefined,
}))

vi.mock('plaid', () => {
  const Products = { Transactions: 'transactions', Auth: 'auth', Identity: 'identity', Assets: 'assets' }
  const CountryCode = { Us: 'US', Ca: 'CA', Gb: 'GB' }
  const PlaidEnvironments = {
    sandbox: 'https://sandbox.plaid.com',
    production: 'https://production.plaid.com',
  }

  return {
    Configuration: vi.fn(),
    PlaidApi: vi.fn(() => ({
      linkTokenCreate,
      itemPublicTokenExchange,
    })),
    PlaidEnvironments,
    Products,
    CountryCode,
  }
})

vi.mock('../../../config/env.js', () => ({
  get env() {
    return envStub
  },
}))

import {
  assertPlaidConfigured,
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  getPlaidOAuthRedirectUri,
} from './plaidClient.js'

describe('getPlaidOAuthRedirectUri', () => {
  it('trims trailing slash from configured URI', () => {
    envStub.PLAID_OAUTH_REDIRECT_URI = 'https://app.example/bank/'
    expect(getPlaidOAuthRedirectUri()).toBe('https://app.example/bank')
  })
})

describe('assertPlaidConfigured', () => {
  it('throws when Plaid secrets are missing', () => {
    envStub.PLAID_CLIENT_ID = ''
    envStub.PLAID_SECRET = ''
    expect(() => assertPlaidConfigured()).toThrowError(
      'PLAID_CLIENT_ID and PLAID_SECRET are required when AGGREGATION_PROVIDER=plaid',
    )
    envStub.PLAID_CLIENT_ID = 'test_plaid_client'
    envStub.PLAID_SECRET = 'test_plaid_secret'
  })
})

describe('exchangePlaidPublicToken', () => {
  beforeEach(() => {
    itemPublicTokenExchange.mockClear()
  })

  it('returns access token and item id from Plaid', async () => {
    const out = await exchangePlaidPublicToken('pub_t')
    expect(out).toEqual({ accessToken: 'acc_t', itemId: 'item_t' })
    expect(itemPublicTokenExchange).toHaveBeenCalledWith({ public_token: 'pub_t' })
  })
})

describe('createPlaidLinkToken', () => {
  beforeEach(() => {
    linkTokenCreate.mockClear()
    envStub.PLAID_OAUTH_REDIRECT_URI = undefined
    envStub.PLAID_CLIENT_ID = 'test_plaid_client'
    envStub.PLAID_SECRET = 'test_plaid_secret'
  })

  it('omits redirect_uri when PLAID_OAUTH_REDIRECT_URI is unset', async () => {
    const token = await createPlaidLinkToken('con_test_123')
    expect(token).toBe('link-sandbox-from-test')

    expect(linkTokenCreate).toHaveBeenCalledTimes(1)
    const body = linkTokenCreate.mock.calls[0]?.[0] as Record<string, unknown>
    expect(body.redirect_uri).toBeUndefined()
    expect(body.user).toEqual({ client_user_id: 'con_test_123' })
  })

  it('includes redirect_uri when PLAID_OAUTH_REDIRECT_URI is set', async () => {
    envStub.PLAID_OAUTH_REDIRECT_URI = 'http://localhost:5173/app/bank-link'

    await createPlaidLinkToken('con_oauth')

    const body = linkTokenCreate.mock.calls[0]?.[0] as Record<string, unknown>
    expect(body.redirect_uri).toBe('http://localhost:5173/app/bank-link')
  })

  it('throws when Plaid returns no link_token', async () => {
    linkTokenCreate.mockResolvedValueOnce({ data: { link_token: undefined } })

    await expect(createPlaidLinkToken('con_empty')).rejects.toMatchObject({
      code: 'PLAID_LINK_TOKEN_FAILED',
    })
  })

  it('wraps unknown errors as PLAID_LINK_TOKEN_FAILED', async () => {
    linkTokenCreate.mockRejectedValueOnce(new Error('network'))

    await expect(createPlaidLinkToken('con_net')).rejects.toMatchObject({
      code: 'PLAID_LINK_TOKEN_FAILED',
    })
  })

  it('maps Plaid INVALID_FIELD to ApiError with message', async () => {
    const axiosLikeError = {
      response: {
        data: {
          error_code: 'INVALID_FIELD',
          error_message: 'OAuth redirect URI must be configured',
        },
      },
    }
    linkTokenCreate.mockRejectedValueOnce(axiosLikeError)

    await expect(createPlaidLinkToken('con_fail')).rejects.toMatchObject({
      statusCode: 502,
      code: 'INVALID_FIELD',
      message: 'OAuth redirect URI must be configured',
    })
  })
})
