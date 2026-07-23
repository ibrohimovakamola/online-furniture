const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const UZ_PHONE_RE = /^\+998\d{9}$/

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'changeme',
  'changeme123',
  'welcome123',
  'letmein1',
])

export function normalizeUzPhone(raw) {
  const digits = String(raw || '').replace(/\s/g, '')
  if (/^\+998\d{9}$/.test(digits)) return digits
  if (/^998\d{9}$/.test(digits)) return `+${digits}`
  if (/^\d{9}$/.test(digits)) return `+998${digits}`
  return digits
}

export function validateEmail(email) {
  const value = String(email || '').trim().toLowerCase()
  if (!value) return { isValid: false, error: 'Email is required' }
  if (!EMAIL_RE.test(value)) return { isValid: false, error: 'Please enter a valid email' }
  return { isValid: true, error: '' }
}

export function validatePhoneNumber(phone) {
  const normalized = normalizeUzPhone(phone)
  if (!normalized) return { isValid: false, error: 'Phone number is required' }
  if (!UZ_PHONE_RE.test(normalized)) {
    return { isValid: false, error: 'Phone must be in +998XXXXXXXXX format' }
  }
  return { isValid: true, error: '', normalized }
}

export function validateName(name, label = 'Name') {
  const value = String(name || '').trim()
  if (value.length < 2) {
    return { isValid: false, error: `${label} must be at least 2 characters` }
  }
  if (!/^[a-zA-ZÀ-ÿ\u0400-\u04FF\s'-]+$/.test(value)) {
    return { isValid: false, error: `${label} may only contain letters` }
  }
  return { isValid: true, error: '' }
}

export function getPasswordStrength(password) {
  const value = String(password || '')
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value)) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

export function validatePassword(password) {
  const value = String(password || '')

  if (value.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
      strength: 'weak',
    }
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and a number',
      strength: getPasswordStrength(value),
    }
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return {
      isValid: false,
      error: 'Password must include a special character (e.g. ! @ # $)',
      strength: getPasswordStrength(value),
    }
  }

  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return {
      isValid: false,
      error: 'This password is too common. Choose a stronger one.',
      strength: 'weak',
    }
  }

  return {
    isValid: true,
    error: '',
    strength: getPasswordStrength(value),
  }
}
