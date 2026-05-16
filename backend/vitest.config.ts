import { defineConfig } from 'vitest/config'

/**
 * Coverage is enforced on a **focused surface**: HTTP helpers, middleware, config,
 * health/internal routes, aggregation & transaction job orchestration, Plaid/Setu
 * glue, analytics service, and recurring job enqueue — not every `.store.ts` /
 * `.routes.ts` in the monolith (those are better covered by integration tests).
 */
const coverageInclude = [
  'src/lib/http.ts',
  'src/lib/emailOtpCrypto.ts',
  'src/middleware/errorHandler.ts',
  'src/middleware/requireSession.ts',
  'src/middleware/requireInternalLaunchReadiness.ts',
  'src/config/healthchecks.ts',
  'src/config/logger.ts',
  'src/config/database.ts',
  'src/config/redis.ts',
  'src/config/env.ts',
  'src/modules/health/health.routes.ts',
  'src/modules/health/launchReadiness.service.ts',
  'src/modules/internal/internal.routes.ts',
  'src/modules/analytics/analytics.service.ts',
  'src/modules/aggregation/aggregation.adapterRegistry.ts',
  'src/modules/aggregation/aggregation.jobs.ts',
  'src/modules/aggregation/callbackPayload.ts',
  'src/modules/aggregation/plaid/plaidClient.ts',
  'src/modules/aggregation/plaid/plaidExchange.ts',
  'src/modules/aggregation/setu/setuAuth.ts',
  'src/modules/aggregation/providers/mockSetu.provider.ts',
  'src/modules/transactions/plaidCategory.ts',
  'src/modules/transactions/plaidIngest.ts',
  'src/modules/transactions/transactions.jobs.ts',
  'src/modules/recurring/recurring.jobs.ts',
  'src/queues/registry.ts',
]

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: coverageInclude,
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 70,
        functions: 80,
      },
    },
  },
})
