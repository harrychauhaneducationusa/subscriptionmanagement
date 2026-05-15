import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
import { ApiError, getRequestMeta } from './http.js'

describe('getRequestMeta', () => {
  it('stringifies request id when present', () => {
    const request = { id: 'req-123' } as unknown as Request
    expect(getRequestMeta(request).request_id).toBe('req-123')
  })

  it('falls back when id is missing', () => {
    const request = {} as unknown as Request
    expect(getRequestMeta(request).request_id).toBe('unknown')
  })
})

describe('ApiError', () => {
  it('stores structured fields', () => {
    const error = new ApiError(422, 'INVALID', 'bad input', { field: 'amount' })
    expect(error.statusCode).toBe(422)
    expect(error.code).toBe('INVALID')
    expect(error.message).toBe('bad input')
    expect(error.details).toEqual({ field: 'amount' })
  })
})
