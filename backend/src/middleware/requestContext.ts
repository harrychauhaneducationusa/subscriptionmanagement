import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { pinoHttp } from 'pino-http'
import { httpRequestCounter } from '../config/metrics.js'
import { logger } from '../config/logger.js'

export const requestLogger = pinoHttp({
  logger,
})

export function assignRequestContext(request: Request, response: Response, next: NextFunction) {
  request.id = request.headers['x-request-id']?.toString() ?? randomUUID()
  response.setHeader('x-request-id', request.id)
  next()
}

export function recordRequestMetrics(request: Request, response: Response, next: NextFunction) {
  response.on('finish', () => {
    httpRequestCounter.inc({
      method: request.method,
      route: request.route?.path ?? request.path,
      status_code: response.statusCode.toString(),
    })
  })

  next()
}
