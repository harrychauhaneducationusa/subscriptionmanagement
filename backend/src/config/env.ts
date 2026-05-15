import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: '../.env' })
dotenv.config()

function parseBool(defaultValue: boolean) {
  return z.preprocess((value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }

    if (typeof value === 'boolean') {
      return value
    }

    const normalized = String(value).trim().toLowerCase()

    if (['true', '1', 'yes'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'no'].includes(normalized)) {
      return false
    }

    return defaultValue
  }, z.boolean())
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().max(500).default(10),
  REDIS_URL: z.string().min(1).optional(),
  /** When set, provider aggregation callbacks must present this value (see `requireAggregationCallbackSecret`). */
  AGGREGATION_CALLBACK_SECRET: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(8).optional(),
  ),
  /**
   * Allows `POST /v1/aggregation/consents/:id/mock-callback` when true, including under `NODE_ENV=production`
   * (for staging). Development and test always allow the session mock route.
   */
  ENABLE_AGGREGATION_SESSION_MOCK: parseBool(false),
  /**
   * `mock` — local mock consent + redirect (default).
   * `setu` — Create Consent via Setu AA HTTP API and accept Setu webhooks on `/v1/aggregation/callbacks/setu`.
   */
  AGGREGATION_PROVIDER: z.enum(['mock', 'setu']).default('mock'),
  /** Base URL for Setu AA / Bridge HTTP APIs (required when `AGGREGATION_PROVIDER=setu`). */
  SETU_AA_BASE_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  SETU_AA_CREATE_CONSENT_PATH: z.string().default('/v2/consent'),
  /** OAuth token URL when using client id/secret (default Setu UAT). Run `npm run setup:setu` to configure. */
  SETU_AA_TOKEN_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().default('https://uat.setu.co/api/v2/auth/token'),
  ),
  SETU_AA_CLIENT_ID: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  SETU_AA_CLIENT_SECRET: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  SETU_AA_PRODUCT_INSTANCE_ID: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  /** Optional static Bearer token; if unset, API uses client id/secret against `SETU_AA_TOKEN_URL`. */
  SETU_AA_API_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  SETU_AA_AUTH_HEADER: z.string().default('Authorization'),
  SETU_AA_CUSTOMER_VUA: z.string().default('9999999999@setu'),
  SETU_AA_CUSTOMER_MOBILE: z.string().default('9999999999'),
  SETU_AA_FIU_ID: z.string().default('subsense-fiu-placeholder'),
  SETU_AA_SCHEMA_VERSION: z.string().default('2.1.0'),
  /**
   * Browser redirect after Create Consent. Placeholders: `{{handle}}` = ConsentHandle, `{{returnUrl}}` = URL-encoded return path.
   * Replace with the URL Setu documents for your product instance.
   */
  SETU_AA_WEB_REDIRECT_TEMPLATE: z
    .string()
    .default('https://bridge.setu.co/aa/consent?consentHandle={{handle}}&redirect={{returnUrl}}'),
  ENABLE_GOOGLE_OAUTH: parseBool(false),
  GOOGLE_CLIENT_ID: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  GOOGLE_CALLBACK_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  ENABLE_EMAIL_OTP: parseBool(true),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).default('SubSense'),
  OTP_EMAIL_PEPPER: z.string().min(16).optional(),
  EMAIL_OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().max(60).default(15),
  OTP_TEST_CODE: z.string().min(4).default('123456'),
  NOTIFICATION_EMAIL_MODE: z.enum(['mock', 'disabled', 'smtp']).default('mock'),
  NOTIFICATION_EMAIL_FROM: z.string().email().default('hello@subsense.local'),
  NOTIFICATION_EMAIL_TEST_RECIPIENT: z.string().email().default('sandbox@subsense.local'),
  /**
   * When set, `GET /v1/internal/launch-readiness` requires header `x-internal-ops-token` to match.
   * In production this must be set so aggregate funnel data is not exposed to authenticated end users alone.
   */
  INTERNAL_OPS_TOKEN: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(8).optional(),
  ),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`)
}

export const env = parsedEnv.data

export function isAggregationSessionMockEnabled() {
  return (
    env.NODE_ENV === 'development' ||
    env.NODE_ENV === 'test' ||
    env.ENABLE_AGGREGATION_SESSION_MOCK
  )
}

export function isGoogleOAuthEnabled() {
  return env.ENABLE_GOOGLE_OAUTH && Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET)
}

export function getOtpEmailPepper() {
  if (env.OTP_EMAIL_PEPPER) {
    return env.OTP_EMAIL_PEPPER
  }

  if (env.NODE_ENV !== 'production') {
    return 'subsense_dev_email_otp_pepper'
  }

  throw new Error('OTP_EMAIL_PEPPER must be set when using email OTP in production')
}
