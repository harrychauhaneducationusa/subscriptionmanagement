import { randomUUID } from 'node:crypto'
import { env } from '../../../config/env.js'
import { ApiError } from '../../../lib/http.js'
import { setConsentProviderReference } from '../aggregation.store.js'
import { assertSetuAaConfigured, buildSetuAaRequestHeaders } from '../setu/setuAuth.js'
import type { AggregationProviderAdapter } from './provider.types.js'

function applyTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (accumulator, [key, value]) => accumulator.split(`{{${key}}}`).join(value),
    template,
  )
}

export const setuAaProviderAdapter: AggregationProviderAdapter = {
  provider: 'setu_aa',
  providerName: 'Setu AA (HTTP)',
  async buildConsentRedirect(input) {
    assertSetuAaConfigured()

    const base = env.SETU_AA_BASE_URL!.replace(/\/$/, '')
    const path = env.SETU_AA_CREATE_CONSENT_PATH.startsWith('/')
      ? env.SETU_AA_CREATE_CONSENT_PATH
      : `/${env.SETU_AA_CREATE_CONSENT_PATH}`
    const url = `${base}${path}`
    const txnid = randomUUID()
    const now = new Date()
    const consentStart = now.toISOString()
    const consentExpiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
    const dataFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

    const body = {
      ver: env.SETU_AA_SCHEMA_VERSION,
      timestamp: consentStart,
      txnid,
      ConsentDetail: {
        consentStart,
        consentExpiry,
        consentMode: 'STORE',
        fetchType: 'PERIODIC',
        consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
        fiTypes: ['DEPOSIT'],
        DataConsumer: {
          id: env.SETU_AA_FIU_ID,
          type: 'FIU',
        },
        Customer: {
          id: env.SETU_AA_CUSTOMER_VUA,
          Identifiers: [{ type: 'MOBILE', value: env.SETU_AA_CUSTOMER_MOBILE }],
        },
        Purpose: {
          code: '101',
          refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
          text: input.institutionName,
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

    const headers = await buildSetuAaRequestHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const rawText = await response.text()

    if (!response.ok) {
      throw new ApiError(
        502,
        'SETU_CREATE_CONSENT_FAILED',
        `Setu Create Consent HTTP ${response.status}: ${rawText.slice(0, 500)}`,
      )
    }

    let json: { ConsentHandle?: string; consentHandle?: string }

    try {
      json = JSON.parse(rawText) as { ConsentHandle?: string; consentHandle?: string }
    } catch {
      throw new ApiError(502, 'SETU_CREATE_CONSENT_INVALID', 'Setu Create Consent response was not JSON')
    }

    const handle = json.ConsentHandle ?? json.consentHandle

    if (!handle) {
      throw new ApiError(502, 'SETU_CREATE_CONSENT_INVALID', 'Setu response did not include ConsentHandle')
    }

    await setConsentProviderReference(input.consentId, handle)

    const returnUrl = encodeURIComponent(input.returnPath)
    const redirectUrl = applyTemplate(env.SETU_AA_WEB_REDIRECT_TEMPLATE, {
      handle: encodeURIComponent(handle),
      returnUrl,
    })

    return {
      provider_name: this.providerName,
      redirect_url: redirectUrl,
      return_path: input.returnPath,
      status: 'pending_user_action',
    }
  },
  parseCallback() {
    throw new ApiError(
      500,
      'SETU_PARSE_VIA_CALLBACK_PAYLOAD',
      'Use parseProviderCallbackPayload for webhook parsing',
    )
  },
}
