import type { Request, Response } from 'express'

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export function getRequestMeta(request: Request) {
  return {
    request_id: request.id ? String(request.id) : 'unknown',
    timestamp: new Date().toISOString(),
  }
}

export function sendData<T>(request: Request, response: Response, data: T, statusCode = 200) {
  response.status(statusCode).json({
    data,
    meta: getRequestMeta(request),
  })
}

export function sendError(request: Request, response: Response, error: ApiError) {
  const retryAfter = error.details?.retryAfterSeconds
  if (error.statusCode === 429 && typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
    response.setHeader('Retry-After', String(Math.ceil(retryAfter)))
  }

  response.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? {},
    },
    meta: getRequestMeta(request),
  })
}
