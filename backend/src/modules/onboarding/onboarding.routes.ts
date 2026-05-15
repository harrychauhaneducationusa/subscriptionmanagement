import { Router } from 'express'
import { z } from 'zod'
import { sendData } from '../../lib/http.js'
import { getOnboardingDraft, updateOnboardingDraft } from './onboarding.store.js'

const updateDraftSchema = z.object({
  householdMode: z.enum(['individual', 'household']).nullable().optional(),
  householdType: z.enum(['individual', 'couple', 'family', 'shared_household']).nullable().optional(),
  essentialRecurringItems: z.array(z.string()).optional(),
  seededSubscriptions: z.array(z.string()).optional(),
})

export const onboardingRouter = Router()

onboardingRouter.get('/draft', async (request, response) => {
  sendData(request, response, {
    draft: await getOnboardingDraft(),
  })
})

onboardingRouter.patch('/draft', async (request, response) => {
  const payload = updateDraftSchema.parse(request.body)
  const draft = await updateOnboardingDraft(payload)

  sendData(request, response, {
    draft,
  })
})
