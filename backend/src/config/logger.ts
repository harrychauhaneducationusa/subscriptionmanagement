import pino from 'pino'
import { env } from './env.js'

export const logger = pino({
  name: 'subsense-api',
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
})
