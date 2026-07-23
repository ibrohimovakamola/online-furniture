import Joi from 'joi'

import { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } from '../middleware/validators.js'

const email = Joi.string().email().trim().lowercase().required()

const password = Joi.string().pattern(PASSWORD_REGEX).required().messages({
  'string.pattern.base': PASSWORD_POLICY_MESSAGE,
})

const uzPhone = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const digits = String(value || '').replace(/\s/g, '')
    let normalized = digits
    if (/^998\d{9}$/.test(digits)) normalized = `+${digits}`
    else if (/^\d{9}$/.test(digits)) normalized = `+998${digits}`
    if (!/^\+998\d{9}$/.test(normalized)) {
      return helpers.message('Phone must be in +998XXXXXXXXX format')
    }
    return normalized
  })

/** POST /api/auth/signup | /register */
export const signupSchema = Joi.object({
  email,
  password,
  confirmPassword: Joi.string().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match',
  }),
  phone: uzPhone,
  phoneNumber: uzPhone,
  name: Joi.string().trim().min(2).max(120),
  firstName: Joi.string().trim().min(2).max(60),
  lastName: Joi.string().trim().min(2).max(60),
  preferredLanguage: Joi.string().valid('uz', 'ru', 'en').default('uz'),
  preferences: Joi.object({
    newsletter: Joi.boolean().default(false),
    notifications: Joi.boolean().default(true),
  }).default({}),
}).custom((value, helpers) => {
  if (!value.phone && !value.phoneNumber) {
    return helpers.message('Phone number is required')
  }
  if (value.name || value.firstName) return value
  return helpers.message('Provide name or firstName')
})

/** POST /api/auth/login */
export const loginSchema = Joi.object({
  email,
  password: Joi.string().min(8).max(128).required(),
  rememberMe: Joi.boolean().default(false),
})

/** POST /api/auth/verify-email */
export const verifyEmailSchema = Joi.object({
  verificationToken: Joi.string().trim().min(16).max(256),
  token: Joi.string().trim().min(16).max(256),
})
  .or('verificationToken', 'token')
  .messages({ 'object.missing': 'Verification token is required' })

/** POST /api/auth/resend-verification */
export const resendVerificationSchema = Joi.object({
  email,
})

/** PUT /api/auth/profile */
export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  firstName: Joi.string().trim().min(2).max(60),
  lastName: Joi.string().trim().min(2).max(60),
  phone: uzPhone.allow(''),
  phoneNumber: uzPhone.allow(''),
  preferredLanguage: Joi.string().valid('uz', 'ru', 'en'),
  profileImage: Joi.string().trim().uri().allow('').max(500),
  address: Joi.alternatives().try(
    Joi.string().trim().max(300).allow(''),
    Joi.object({
      street: Joi.string().trim().max(300).allow(''),
      city: Joi.string().trim().max(120).allow(''),
      region: Joi.string().trim().max(120).allow(''),
      postalCode: Joi.string().trim().max(20).allow(''),
    })
  ),
  preferences: Joi.object({
    newsletter: Joi.boolean(),
    notifications: Joi.boolean(),
  }),
}).min(1)

/** DELETE /api/auth/account — optional password confirmation */
export const deleteAccountSchema = Joi.object({
  password: Joi.string().min(8).max(128),
})
