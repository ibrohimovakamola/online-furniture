import crypto from 'crypto'

const UZ_PHONE_RE = /^\+998\d{9}$/

export function normalizeUzPhone(raw) {
  const digits = String(raw || '').replace(/\s/g, '')
  if (/^\+998\d{9}$/.test(digits)) return digits
  if (/^998\d{9}$/.test(digits)) return `+${digits}`
  if (/^\d{9}$/.test(digits)) return `+998${digits}`
  return ''
}

export function isValidUzPhone(raw) {
  return UZ_PHONE_RE.test(normalizeUzPhone(raw))
}

export function requireEmailVerification() {
  const flag = process.env.REQUIRE_EMAIL_VERIFICATION
  if (flag === 'true') return true
  if (flag === 'false') return false
  return process.env.NODE_ENV === 'production'
}

export function hashAuthToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateRawAuthToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function formatAddressField(address) {
  if (!address) {
    return { street: '', city: '', region: '', postalCode: '' }
  }
  if (typeof address === 'string') {
    return { street: address, city: '', region: '', postalCode: '' }
  }
  return {
    street: address.street || '',
    city: address.city || '',
    region: address.region || '',
    postalCode: address.postalCode || '',
  }
}
