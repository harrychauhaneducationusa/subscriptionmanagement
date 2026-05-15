import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { getOtpEmailPepper } from '../config/env.js'

export function generateNumericOtp(digits = 6) {
  const max = 10 ** digits
  return String(randomInt(0, max)).padStart(digits, '0')
}

export function hashEmailOtp(code: string) {
  return createHmac('sha256', getOtpEmailPepper()).update(code, 'utf8').digest('hex')
}

export function verifyEmailOtpHash(code: string, codeHash: string) {
  const computed = hashEmailOtp(code)

  try {
    const left = Buffer.from(computed, 'hex')
    const right = Buffer.from(codeHash, 'hex')

    if (left.length !== right.length) {
      return false
    }

    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}
