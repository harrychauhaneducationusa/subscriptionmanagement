import { Router } from 'express'
import { requireSession } from '../../middleware/requireSession.js'
import { requireInternalLaunchReadinessAccess } from '../../middleware/requireInternalLaunchReadiness.js'
import { sendData } from '../../lib/http.js'
import { getLaunchReadinessReport } from '../health/launchReadiness.service.js'

export const internalRouter = Router()

internalRouter.get(
  '/launch-readiness',
  requireSession,
  requireInternalLaunchReadinessAccess,
  async (request, response) => {
    const report = await getLaunchReadinessReport()
    sendData(request, response, report)
  },
)
