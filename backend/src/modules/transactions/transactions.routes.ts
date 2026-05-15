import { Router } from 'express'
import { requireSession } from '../../middleware/requireSession.js'
import { ApiError, sendData } from '../../lib/http.js'
import { listRecentNormalizedTransactions } from './transactions.store.js'

export const transactionsRouter = Router()
transactionsRouter.use(requireSession)

transactionsRouter.get('/recent', async (request, response) => {
  const householdId = request.authSession?.defaultHouseholdId

  if (!householdId) {
    throw new ApiError(
      400,
      'HOUSEHOLD_CONTEXT_REQUIRED',
      'An active household is required before linked transactions can be shown',
    )
  }

  const transactions = await listRecentNormalizedTransactions(householdId)

  sendData(request, response, {
    items: transactions,
    empty_state: transactions.length === 0 ? 'no_ingested_transactions' : null,
  })
})
