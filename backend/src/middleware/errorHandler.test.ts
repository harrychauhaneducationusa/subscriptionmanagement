import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError } from '../lib/http.js'
import { errorHandler, notFoundHandler } from './errorHandler.js'

vi.mock('../config/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

function mockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
  }
  return res as unknown as Response
}

describe('notFoundHandler', () => {
  it('passes ApiError 404 to next', () => {
    const next = vi.fn()
    const req = { method: 'GET', path: '/nope' } as Request
    notFoundHandler(req, mockResponse(), next as unknown as NextFunction)

    expect(next).toHaveBeenCalledTimes(1)
    const err = vi.mocked(next).mock.calls[0]?.[0] as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })
})

describe('errorHandler', () => {
  it('sends ApiError payload', () => {
    const req = { id: 'r1' } as Request
    const res = mockResponse()
    errorHandler(new ApiError(422, 'X', 'msg', { a: 1 }), req, res, vi.fn() as NextFunction)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'X', message: 'msg', details: { a: 1 } }),
        meta: expect.objectContaining({ request_id: 'r1' }),
      }),
    )
  })

  it('maps ZodError to 400 VALIDATION_ERROR', () => {
    const req = { id: 'r2' } as Request
    const res = mockResponse()
    const parsed = z.object({ n: z.number() }).safeParse({ n: 'bad' })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      errorHandler(parsed.error, req, res, vi.fn() as NextFunction)
    }

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    )
  })

  it('sets Retry-After on 429 when retryAfterSeconds present', () => {
    const req = {} as Request
    const res = mockResponse()
    errorHandler(
      new ApiError(429, 'RATE', 'slow down', { retryAfterSeconds: 12.3 }),
      req,
      res,
      vi.fn() as NextFunction,
    )

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '13')
  })

  it('maps unknown errors to 500', async () => {
    const { logger } = await import('../config/logger.js')
    const req = {} as Request
    const res = mockResponse()
    errorHandler(new Error('boom'), req, res, vi.fn() as NextFunction)

    expect(logger.error).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      }),
    )
  })
})
