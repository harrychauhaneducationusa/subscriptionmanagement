#!/usr/bin/env node
/**
 * Interactive Plaid sandbox configuration for SubSense (US market).
 *
 * Writes PLAID_* and AGGREGATION_PROVIDER=plaid into .env and smoke-tests link/token/create.
 * Keys: https://dashboard.plaid.com/developers/keys
 *
 * Usage:
 *   npm run setup:plaid
 *   npm run setup:plaid -- --yes
 */

import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { existsSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULTS, testPlaidLinkToken, upsertEnvFile } from './lib/plaid-env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ENV_FILE = join(ROOT, '.env')
const EXAMPLE_FILE = join(ROOT, '.env.example')

const args = new Set(process.argv.slice(2))
const nonInteractive = args.has('--yes') || args.has('-y')

async function prompt(rl, label, { defaultValue = '' } = {}) {
  const suffix = defaultValue ? ` [${defaultValue}]` : ''
  const answer = await rl.question(`${label}${suffix}: `)
  const trimmed = answer.trim()
  return trimmed || defaultValue
}

async function main() {
  const rl = nonInteractive ? null : createInterface({ input, output })

  try {
    const clientId =
      process.env.PLAID_SETUP_CLIENT_ID?.trim() ??
      (rl ? await prompt(rl, 'Plaid client_id (Dashboard → Keys)') : '')

    const secret =
      process.env.PLAID_SETUP_SECRET?.trim() ??
      (rl ? await prompt(rl, 'Plaid secret (sandbox)') : '')

    if (!clientId || !secret) {
      throw new Error('PLAID_SETUP_CLIENT_ID and PLAID_SETUP_SECRET are required (or run interactively)')
    }

    const plaidEnv =
      process.env.PLAID_SETUP_ENV?.trim() ||
      (rl ? await prompt(rl, 'Plaid environment', { defaultValue: DEFAULTS.PLAID_ENV }) : DEFAULTS.PLAID_ENV)

    console.log('\nTesting Plaid link/token/create...')
    const test = await testPlaidLinkToken(clientId, secret, plaidEnv)

    if (!test.ok) {
      console.error(`Plaid API test failed (HTTP ${test.status}): ${test.body}`)
      process.exit(1)
    }

    console.log(`Plaid OK — link_token prefix: ${test.linkTokenPrefix}…`)

    if (!existsSync(ENV_FILE) && existsSync(EXAMPLE_FILE)) {
      copyFileSync(EXAMPLE_FILE, ENV_FILE)
      console.log(`Created ${ENV_FILE} from .env.example`)
    }

    upsertEnvFile(ENV_FILE, {
      AGGREGATION_PROVIDER: DEFAULTS.AGGREGATION_PROVIDER,
      PLAID_CLIENT_ID: clientId,
      PLAID_SECRET: secret,
      PLAID_ENV: plaidEnv,
      PLAID_PRODUCTS: DEFAULTS.PLAID_PRODUCTS,
      PLAID_COUNTRY_CODES: DEFAULTS.PLAID_COUNTRY_CODES,
    })

    console.log(`\nUpdated ${ENV_FILE}`)
    console.log('Next: set AGGREGATION_PROVIDER=plaid (done), restart API, open Bank Link in the app.')
    console.log('Sandbox test user: user_good / pass_good')
  } finally {
    rl?.close()
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
