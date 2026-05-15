import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

export const DEFAULTS = {
  SETU_AA_BASE_URL: 'https://fiu-sandbox.setu.co',
  SETU_AA_CREATE_CONSENT_PATH: '/v2/consent',
  SETU_AA_TOKEN_URL: 'https://uat.setu.co/api/v2/auth/token',
  SETU_AA_SCHEMA_VERSION: '2.1.0',
  SETU_AA_WEB_REDIRECT_TEMPLATE:
    'https://bridge.setu.co/aa/consent?consentHandle={{handle}}&redirect={{returnUrl}}',
  AGGREGATION_PROVIDER: 'setu',
  ENABLE_AGGREGATION_SESSION_MOCK: 'true',
}

export function upsertEnvFile(envPath, updates) {
  const lines = existsSync(envPath)
    ? readFileSync(envPath, 'utf8').split('\n')
    : []

  const keys = new Set(Object.keys(updates))
  const output = []
  const written = new Set()

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=/)

    if (match && keys.has(match[1])) {
      output.push(`${match[1]}=${formatEnvValue(updates[match[1]])}`)
      written.add(match[1])
    } else {
      output.push(line)
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!written.has(key)) {
      if (output.length > 0 && output[output.length - 1] !== '') {
        output.push('')
      }
      output.push(`${key}=${formatEnvValue(value)}`)
    }
  }

  writeFileSync(envPath, output.join('\n').replace(/\n*$/, '\n'))
}

function formatEnvValue(value) {
  if (value === undefined || value === null) {
    return ''
  }

  const stringValue = String(value)

  if (stringValue === '') {
    return ''
  }

  if (/[\s#"'\\]/.test(stringValue)) {
    return `"${stringValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }

  return stringValue
}

export async function fetchSetuAccessToken({
  tokenUrl,
  clientId,
  clientSecret,
}) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientID: clientId,
      secret: clientSecret,
    }),
  })

  const rawText = await response.text()
  let json

  try {
    json = rawText ? JSON.parse(rawText) : {}
  } catch {
    throw new Error(`Token response was not JSON (HTTP ${response.status}): ${rawText.slice(0, 300)}`)
  }

  if (!response.ok) {
    throw new Error(
      `Token request failed (HTTP ${response.status}): ${JSON.stringify(json).slice(0, 400)}`,
    )
  }

  const token =
    json.accessToken ??
    json.access_token ??
    json.data?.accessToken ??
    json.data?.access_token

  const expiresIn = Number(json.expiresIn ?? json.expires_in ?? json.data?.expiresIn ?? 1800)

  if (!token || typeof token !== 'string') {
    throw new Error(`Token response missing access token: ${JSON.stringify(json).slice(0, 400)}`)
  }

  return { token, expiresIn }
}

export function buildCreateConsentBody({
  fiuId,
  customerVua,
  customerMobile,
  institutionName,
  schemaVersion,
}) {
  const now = new Date()
  const consentStart = now.toISOString()
  const consentExpiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
  const dataFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

  return {
    ver: schemaVersion,
    timestamp: consentStart,
    txnid: randomUUID(),
    ConsentDetail: {
      consentStart,
      consentExpiry,
      consentMode: 'STORE',
      fetchType: 'PERIODIC',
      consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      fiTypes: ['DEPOSIT'],
      DataConsumer: {
        id: fiuId,
        type: 'FIU',
      },
      Customer: {
        id: customerVua,
        Identifiers: [{ type: 'MOBILE', value: customerMobile }],
      },
      Purpose: {
        code: '101',
        refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
        text: institutionName,
        Category: { type: 'string' },
      },
      FIDataRange: {
        from: dataFrom,
        to: consentStart,
      },
      DataLife: { unit: 'MONTH', value: 1 },
      Frequency: { unit: 'DAY', value: 1 },
    },
  }
}

export async function testCreateConsent({
  baseUrl,
  consentPath,
  productInstanceId,
  accessToken,
  body,
}) {
  const base = baseUrl.replace(/\/$/, '')
  const path = consentPath.startsWith('/') ? consentPath : `/${consentPath}`
  const url = `${base}${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'x-product-instance-id': productInstanceId,
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()
  let json

  try {
    json = rawText ? JSON.parse(rawText) : {}
  } catch {
    throw new Error(`Create Consent response was not JSON (HTTP ${response.status}): ${rawText.slice(0, 400)}`)
  }

  if (!response.ok) {
    throw new Error(
      `Create Consent failed (HTTP ${response.status}): ${JSON.stringify(json).slice(0, 500)}`,
    )
  }

  const handle = json.ConsentHandle ?? json.consentHandle ?? json.id

  if (!handle) {
    throw new Error(`Create Consent OK but no handle in response: ${JSON.stringify(json).slice(0, 400)}`)
  }

  return { handle, json }
}
