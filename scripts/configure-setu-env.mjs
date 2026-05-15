#!/usr/bin/env node
/**
 * Interactive Setu AA sandbox configuration for SubSense.
 *
 * Writes Bridge credentials into .env, fetches an access token, and smoke-tests Create Consent.
 * Bridge FIU/product setup remains manual: https://bridge.setu.co
 *
 * Usage:
 *   npm run setup:setu
 *   npm run setup:setu -- --yes   # non-interactive; read SETU_SETUP_* env vars
 */

import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULTS,
  buildCreateConsentBody,
  fetchSetuAccessToken,
  testCreateConsent,
  upsertEnvFile,
} from './lib/setu-env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ENV_FILE = join(ROOT, '.env')
const EXAMPLE_FILE = join(ROOT, '.env.example')

const args = new Set(process.argv.slice(2))
const nonInteractive = args.has('--yes') || args.has('-y')

function envOrPrompt(name, promptText, { defaultValue = '', secret = false } = {}) {
  const fromEnv = process.env[name]?.trim()

  if (fromEnv) {
    return fromEnv
  }

  if (nonInteractive) {
    if (defaultValue) {
      return defaultValue
    }

    throw new Error(`Missing ${name} (set env var or run without --yes)`)
  }

  return null
}

async function prompt(rl, label, { defaultValue = '', secret = false } = {}) {
  const suffix = defaultValue ? ` [${defaultValue}]` : ''
  const answer = await rl.question(`${label}${suffix}: `)
  const trimmed = answer.trim()

  if (!trimmed && defaultValue) {
    return defaultValue
  }

  return trimmed
}

async function collectConfig(rl) {
  const clientId =
    envOrPrompt('SETU_SETUP_CLIENT_ID') ??
    (await prompt(rl, 'Setu x-client-id (Bridge Step 2)'))

  const clientSecret =
    envOrPrompt('SETU_SETUP_CLIENT_SECRET') ??
    (await prompt(rl, 'Setu x-client-secret', { secret: true }))

  const productInstanceId =
    envOrPrompt('SETU_SETUP_PRODUCT_INSTANCE_ID') ??
    (await prompt(rl, 'Setu x-product-instance-id (Bridge Step 2)'))

  const fiuId =
    envOrPrompt('SETU_SETUP_FIU_ID') ??
    (await prompt(rl, 'Setu FIU id (DataConsumer.id from Bridge)', {
      defaultValue: 'subsense-fiu-placeholder',
    }))

  const mobile =
    envOrPrompt('SETU_SETUP_MOBILE') ??
    (await prompt(rl, 'Test customer mobile (10 digits)', { defaultValue: '9999999999' }))

  const baseUrl =
    envOrPrompt('SETU_SETUP_BASE_URL') ??
    (await prompt(rl, 'Setu FIU API base URL', { defaultValue: DEFAULTS.SETU_AA_BASE_URL }))

  const tokenUrl =
    envOrPrompt('SETU_SETUP_TOKEN_URL') ??
    (await prompt(rl, 'Setu OAuth token URL', { defaultValue: DEFAULTS.SETU_AA_TOKEN_URL }))

  const consentPath =
    envOrPrompt('SETU_SETUP_CONSENT_PATH') ??
    (await prompt(rl, 'Create Consent path', { defaultValue: DEFAULTS.SETU_AA_CREATE_CONSENT_PATH }))

  const callbackSecret =
    envOrPrompt('SETU_SETUP_CALLBACK_SECRET') ??
    (await prompt(rl, 'AGGREGATION_CALLBACK_SECRET (min 8 chars)', {
      defaultValue: 'subsense-local-aggregation-callback-secret-min-8-chars',
    }))

  const publicWebhookBase =
    envOrPrompt('SETU_SETUP_WEBHOOK_BASE_URL') ??
    (await prompt(rl, 'Public API base for webhooks (ngrok URL, or leave empty)', {
      defaultValue: '',
    }))

  const customerVua = mobile.includes('@') ? mobile : `${mobile}@setu`

  return {
    clientId,
    clientSecret,
    productInstanceId,
    fiuId,
    mobile: mobile.replace(/@.*$/, ''),
    customerVua,
    baseUrl,
    tokenUrl,
    consentPath,
    callbackSecret,
    publicWebhookBase,
  }
}

function printBridgeReminder(webhookUrl) {
  console.log('\n--- Manual step on Setu Bridge (one-time) ---')
  console.log('1. https://bridge.setu.co → FIU → Account Aggregator - Data → complete Step 1')
  console.log('2. Step 2: copy credentials you pasted into this script')
  if (webhookUrl) {
    console.log(`3. Set notification URL to:\n   ${webhookUrl}`)
    console.log('   (Use the same value for AGGREGATION_CALLBACK_SECRET if Bridge supports custom headers)')
  } else {
    console.log('3. Run: ngrok http 4000')
    console.log('   Then set notification URL to: https://<ngrok-host>/v1/aggregation/callbacks/setu')
  }
  console.log('4. Sandbox banks: use Setu FIP-2 with OTP 123456')
  console.log('5. Restart API: npm run dev:api -w backend')
}

async function main() {
  if (!existsSync(ENV_FILE) && existsSync(EXAMPLE_FILE)) {
    console.log(`No .env found — copy from .env.example first:\n  cp .env.example .env`)
    process.exit(1)
  }

  const rl = nonInteractive ? null : createInterface({ input, output })

  try {
    console.log('SubSense — Setu AA sandbox setup\n')

    const config = await collectConfig(rl)

    if (!config.clientId || !config.clientSecret || !config.productInstanceId) {
      throw new Error('client id, client secret, and product instance id are required')
    }

    if (config.callbackSecret.length < 8) {
      throw new Error('AGGREGATION_CALLBACK_SECRET must be at least 8 characters')
    }

    console.log('\n==> Fetching OAuth access token...')
    const { token, expiresIn } = await fetchSetuAccessToken({
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    })
    console.log(`    OK (expires in ~${expiresIn}s)`)

    console.log('==> Smoke test: Create Consent...')
    const consentBody = buildCreateConsentBody({
      fiuId: config.fiuId,
      customerVua: config.customerVua,
      customerMobile: config.mobile,
      institutionName: 'SubSense sandbox test',
      schemaVersion: DEFAULTS.SETU_AA_SCHEMA_VERSION,
    })

    const { handle } = await testCreateConsent({
      baseUrl: config.baseUrl,
      consentPath: config.consentPath,
      productInstanceId: config.productInstanceId,
      accessToken: token,
      body: consentBody,
    })
    console.log(`    OK — ConsentHandle: ${handle}`)

    const webhookUrl = config.publicWebhookBase
      ? `${config.publicWebhookBase.replace(/\/$/, '')}/v1/aggregation/callbacks/setu`
      : ''

    console.log('\n==> Updating .env ...')
    upsertEnvFile(ENV_FILE, {
      AGGREGATION_PROVIDER: DEFAULTS.AGGREGATION_PROVIDER,
      ENABLE_AGGREGATION_SESSION_MOCK: DEFAULTS.ENABLE_AGGREGATION_SESSION_MOCK,
      AGGREGATION_CALLBACK_SECRET: config.callbackSecret,
      SETU_AA_BASE_URL: config.baseUrl,
      SETU_AA_CREATE_CONSENT_PATH: config.consentPath,
      SETU_AA_TOKEN_URL: config.tokenUrl,
      SETU_AA_CLIENT_ID: config.clientId,
      SETU_AA_CLIENT_SECRET: config.clientSecret,
      SETU_AA_PRODUCT_INSTANCE_ID: config.productInstanceId,
      SETU_AA_FIU_ID: config.fiuId,
      SETU_AA_CUSTOMER_VUA: config.customerVua,
      SETU_AA_CUSTOMER_MOBILE: config.mobile,
      SETU_AA_SCHEMA_VERSION: DEFAULTS.SETU_AA_SCHEMA_VERSION,
      SETU_AA_WEB_REDIRECT_TEMPLATE: DEFAULTS.SETU_AA_WEB_REDIRECT_TEMPLATE,
      SETU_AA_AUTH_HEADER: 'Authorization',
      SETU_AA_API_KEY: '',
    })

    console.log(`    Wrote ${ENV_FILE}`)
    printBridgeReminder(webhookUrl)

    console.log('\nDone. Bank Link will use real Setu Create Consent when the API restarts.')
  } catch (error) {
    console.error('\nSetup failed:', error instanceof Error ? error.message : error)
    console.error('\nIf token fails, confirm credentials in Bridge Step 2 or try SETU_SETUP_TOKEN_URL.')
    process.exit(1)
  } finally {
    rl?.close()
  }
}

main()
