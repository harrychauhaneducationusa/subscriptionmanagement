import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ApiError, sendError } from '../lib/http.js'
import { logger } from '../config/logger.js'

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${request.method} ${request.path} was not found`))
}

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    sendError(request, response, error)
    return
  }

  if (error instanceof ZodError) {
    sendError(
      request,
      response,
      new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', {
        issues: error.flatten(),
      }),
    )
    return
  }

  logger.error({ error, requestId: request.id }, 'Unhandled API error')
  sendError(request, response, new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong'))
}
