import { validationResult } from 'express-validator'
import { ValidationError } from '../utils/AppError.js'

/** Strong password: 8+ chars, letter, digit, special character */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8–128 characters and include a letter, a number, and a special character'

/**
 * Express-validator error handler — throws AppError-compatible response.
 */
export function handleValidationErrors(req, res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const details = result.array().map((e) => ({
    field: e.path || 'body',
    message: e.msg,
  }))

  next(new ValidationError('Validation failed', details))
}

/** Sanitize all string fields in req.body (strip HTML via escape). Skips password fields. */
export function sanitizeBodyStrings(skipFields = ['password', 'currentPassword', 'newPassword']) {
  return (req, _res, next) => {
    if (!req.body || typeof req.body !== 'object') return next()
    for (const [key, value] of Object.entries(req.body)) {
      if (skipFields.includes(key)) continue
      if (typeof value === 'string') {
        req.body[key] = value.trim()
      }
    }
    next()
  }
}
