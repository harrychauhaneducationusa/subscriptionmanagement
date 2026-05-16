const prefix = 'subsense_plaid_link_token_'

export function storePlaidLinkToken(consentId: string, linkToken: string) {
  sessionStorage.setItem(`${prefix}${consentId}`, linkToken)
}

export function readPlaidLinkToken(consentId: string) {
  return sessionStorage.getItem(`${prefix}${consentId}`)
}

export function clearPlaidLinkToken(consentId: string) {
  sessionStorage.removeItem(`${prefix}${consentId}`)
}
