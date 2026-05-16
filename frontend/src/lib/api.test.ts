import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './api'

describe('getApiErrorMessage', () => {
  it('reads API envelope message from axios error', () => {
    const err = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 502,
        data: { error: { code: 'PLAID_ERROR', message: 'OAuth redirect URI must be configured' } },
      } as never,
    )

    expect(getApiErrorMessage(err)).toBe('OAuth redirect URI must be configured')
  })

  it('falls back to axios message or default', () => {
    const err = new axios.AxiosError('Network Error', 'ERR_NETWORK')

    expect(getApiErrorMessage(err)).toBe('Network Error')
    expect(getApiErrorMessage(new Error('plain'))).toBe('plain')
    expect(getApiErrorMessage('x', 'fallback')).toBe('fallback')
  })
})
