import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULTS = {
  AGGREGATION_PROVIDER: 'plaid',
  PLAID_ENV: 'sandbox',
  PLAID_PRODUCTS: 'transactions',
  PLAID_COUNTRY_CODES: 'US',
}

export function upsertEnvFile(envPath, updates) {
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split('\n') : []
  const keys = new Set(Object.keys(updates))
  const output = []

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=/)

    if (match && keys.has(match[1])) {
      keys.delete(match[1])
      output.push(`${match[1]}=${formatEnvValue(updates[match[1]])}`)
    } else {
      output.push(line)
    }
  }

  for (const key of keys) {
    output.push(`${key}=${formatEnvValue(updates[key])}`)
  }

  writeFileSync(envPath, `${output.join('\n').replace(/\n*$/, '')}\n`)
}

function formatEnvValue(value) {
  if (value === undefined || value === null) {
    return ''
  }

  const stringValue = String(value)

  if (/[\s#"'\\]/.test(stringValue)) {
    return `"${stringValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }

  return stringValue
}

export async function testPlaidLinkToken(clientId, secret, envName = 'sandbox') {
  const basePath =
    envName === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com'

  const response = await fetch(`${basePath}/link/token/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': secret,
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      user: { client_user_id: `setup_test_${Date.now()}` },
      client_name: 'SubSense',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }),
  })

  const text = await response.text()

  if (!response.ok) {
    return { ok: false, status: response.status, body: text.slice(0, 400) }
  }

  let json

  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, status: response.status, body: 'Invalid JSON from Plaid' }
  }

  if (!json.link_token) {
    return { ok: false, status: response.status, body: 'No link_token in response' }
  }

  return { ok: true, linkTokenPrefix: String(json.link_token).slice(0, 12) }
}
