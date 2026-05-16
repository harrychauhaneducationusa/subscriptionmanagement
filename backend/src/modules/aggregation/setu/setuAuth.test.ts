import { afterEach, describe, expect, it, vi } from 'vitest'

const envStub = vi.hoisted(() => ({
  SETU_AA_BASE_URL: 'https://setu.example',
  SETU_AA_PRODUCT_INSTANCE_ID: 'prod_inst',
  SETU_AA_API_KEY: '' as string,
  SETU_AA_CLIENT_ID: '' as string,
  SETU_AA_CLIENT_SECRET: '' as string,
  SETU_AA_TOKEN_URL: 'https://setu.example/token',
  SETU_AA_AUTH_HEADER: 'Authorization',
}))

vi.mock('../../../config/env.js', () => ({
  get env() {
    return envStub
  },
}))

describe('setuAuth', () => {
  afterEach(() => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = ''
    envStub.SETU_AA_CLIENT_SECRET = ''
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('assertSetuAaConfigured throws without base URL', async () => {
    envStub.SETU_AA_BASE_URL = ''
    try {
      const { assertSetuAaConfigured } = await import('./setuAuth.js')
      expect(() => assertSetuAaConfigured()).toThrowError(
        'SETU_AA_BASE_URL must be set when AGGREGATION_PROVIDER=setu',
      )
    } finally {
      envStub.SETU_AA_BASE_URL = 'https://setu.example'
    }
  })

  it('assertSetuAaConfigured throws without product instance', async () => {
    envStub.SETU_AA_PRODUCT_INSTANCE_ID = ''
    try {
      const { assertSetuAaConfigured } = await import('./setuAuth.js')
      expect(() => assertSetuAaConfigured()).toThrowError(
        'SETU_AA_PRODUCT_INSTANCE_ID must be set when AGGREGATION_PROVIDER=setu',
      )
    } finally {
      envStub.SETU_AA_PRODUCT_INSTANCE_ID = 'prod_inst'
    }
  })

  it('getSetuAccessToken returns static API key when configured', async () => {
    envStub.SETU_AA_API_KEY = 'static-key'
    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).resolves.toBe('static-key')
  })

  it('buildSetuAaRequestHeaders uses custom auth header name', async () => {
    envStub.SETU_AA_API_KEY = 'static-key'
    envStub.SETU_AA_AUTH_HEADER = 'X-Api-Key'
    const { buildSetuAaRequestHeaders } = await import('./setuAuth.js')
    const headers = await buildSetuAaRequestHeaders()
    expect(headers['X-Api-Key']).toBe('static-key')
    expect(headers['x-product-instance-id']).toBe('prod_inst')
    envStub.SETU_AA_AUTH_HEADER = 'Authorization'
  })

  it('assertSetuAaConfigured throws when neither API key nor OAuth is configured', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = ''
    envStub.SETU_AA_CLIENT_SECRET = ''
    try {
      const { assertSetuAaConfigured } = await import('./setuAuth.js')
      expect(() => assertSetuAaConfigured()).toThrowError(
        'Set SETU_AA_API_KEY or SETU_AA_CLIENT_ID + SETU_AA_CLIENT_SECRET + SETU_AA_TOKEN_URL',
      )
    } finally {
      envStub.SETU_AA_CLIENT_ID = ''
      envStub.SETU_AA_CLIENT_SECRET = ''
    }
  })

  it('getSetuAccessToken rejects when OAuth is incomplete', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = ''
    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).rejects.toMatchObject({ code: 'SETU_AA_NOT_CONFIGURED' })
  })

  it('getSetuAccessToken fetches and caches OAuth token', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = 'cid'
    envStub.SETU_AA_CLIENT_SECRET = 'sec'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ data: { accessToken: 'oauth_tok', expiresIn: 3600 } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).resolves.toBe('oauth_tok')
    await expect(getSetuAccessToken()).resolves.toBe('oauth_tok')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('getSetuAccessToken fails when token endpoint returns non-JSON', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = 'cid'
    envStub.SETU_AA_CLIENT_SECRET = 'sec'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'not-json',
      }),
    )

    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).rejects.toMatchObject({ code: 'SETU_TOKEN_INVALID' })
  })

  it('getSetuAccessToken fails when HTTP status is not ok', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = 'cid'
    envStub.SETU_AA_CLIENT_SECRET = 'sec'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":true}',
      }),
    )

    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).rejects.toMatchObject({ code: 'SETU_TOKEN_FAILED' })
  })

  it('getSetuAccessToken fails when JSON has no access token', async () => {
    envStub.SETU_AA_API_KEY = ''
    envStub.SETU_AA_CLIENT_ID = 'cid'
    envStub.SETU_AA_CLIENT_SECRET = 'sec'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ data: {} }),
      }),
    )

    const { getSetuAccessToken } = await import('./setuAuth.js')
    await expect(getSetuAccessToken()).rejects.toMatchObject({ code: 'SETU_TOKEN_INVALID' })
  })
})
