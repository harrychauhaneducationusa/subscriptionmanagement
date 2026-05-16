import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, getRequestMeta, sendData, sendError } from './http.js'

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

describe('sendData and sendError', () => {
  it('sendData writes envelope with status', () => {
    const req = { id: 'rid' } as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    sendData(req, res, { ok: true }, 201)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      data: { ok: true },
      meta: expect.objectContaining({ request_id: 'rid' }),
    })
  })

  it('sendError sets Retry-After for 429', () => {
    const req = { id: 'r' } as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as Response

    sendError(req, res, new ApiError(429, 'R', 'wait', { retryAfterSeconds: 5 }))

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '5')
    expect(res.status).toHaveBeenCalledWith(429)
  })
})
