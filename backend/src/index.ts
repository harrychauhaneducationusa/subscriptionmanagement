import { createServer } from 'node:http'
import { configurePassport } from './config/passport.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { createApp } from './app.js'

configurePassport()

const app = createApp()
const server = createServer(app)

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      frontendUrl: env.FRONTEND_URL,
      nodeEnv: env.NODE_ENV,
    },
    'SubSense API started',
  )
})
