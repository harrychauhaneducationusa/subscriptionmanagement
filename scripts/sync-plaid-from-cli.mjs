#!/usr/bin/env node
/**
 * Copy Plaid API credentials from the official Plaid CLI config into SubSense `.env`.
 *
 * Prerequisite:
 *   brew install plaid/plaid-cli/plaid
 *   plaid login
 *   plaid keys fetch
 *
 * Usage:
 *   npm run sync:plaid-cli
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { testPlaidLinkToken, upsertEnvFile } from './lib/plaid-env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ENV_FILE = join(ROOT, '.env')
const CLI_CONFIG = join(homedir(), 'Library/Application Support/plaid-cli/config.json')

function loadCliConfig() {
  if (!existsSync(CLI_CONFIG)) {
    throw new Error(
      `Plaid CLI config not found at ${CLI_CONFIG}. Run: plaid login && plaid keys fetch`,
    )
  }

  return JSON.parse(readFileSync(CLI_CONFIG, 'utf8'))
}

async function main() {
  const config = loadCliConfig()
  const envName = config.env === 'production' ? 'production' : 'sandbox'
  const clientId = config.client_id
  const secret = config.environments?.[envName]?.secret

  if (!clientId || !secret) {
    throw new Error(
      `Missing ${envName} credentials in CLI config. Run: plaid config set --env ${envName} && plaid keys fetch`,
    )
  }

  console.log(`Using Plaid CLI config (${envName})…`)
  const test = await testPlaidLinkToken(clientId, secret, envName)

  if (!test.ok) {
    console.error(`Plaid API test failed: ${test.body}`)
    process.exit(1)
  }

  console.log(`Plaid link/token/create OK (${test.linkTokenPrefix}…)`)

  upsertEnvFile(ENV_FILE, {
    AGGREGATION_PROVIDER: 'plaid',
    PLAID_CLIENT_ID: clientId,
    PLAID_SECRET: secret,
    PLAID_ENV: envName,
    PLAID_PRODUCTS: 'transactions',
    PLAID_COUNTRY_CODES: 'US',
    VITE_AGGREGATION_PROVIDER: 'plaid',
  })

  console.log(`Updated ${ENV_FILE} for Plaid (${envName}). Restart API and frontend.`)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
