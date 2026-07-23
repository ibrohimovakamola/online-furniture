import { body, param, query } from 'express-validator'
import { handleValidationErrors, PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } from './validators.js'

const uzPhonePattern = /^(\+998|998)?[0-9]{9,12}$/

export const loginValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password is required'),
  handleValidationErrors,
]

export const signupValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(uzPhonePattern)
    .withMessage('Invalid phone number format'),
  body('phoneNumber')
    .optional({ values: 'falsy' })
    .trim()
    .matches(uzPhonePattern)
    .withMessage('Invalid phone number format'),
  body('preferredLanguage').optional().isIn(['uz', 'ru', 'en']),
  body('name').optional().trim().isLength({ min: 2, max: 120 }).escape(),
  body('firstName').optional().trim().isLength({ min: 2, max: 60 }).escape(),
  body('lastName').optional().trim().isLength({ min: 2, max: 60 }).escape(),
  handleValidationErrors,
]

export const forgotPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  handleValidationErrors,
]

export const resetPasswordValidators = [
  body('token').optional().trim().isLength({ max: 256 }),
  body('resetToken').optional().trim().isLength({ max: 256 }),
  body('password').optional().matches(PASSWORD_REGEX).withMessage(PASSWORD_POLICY_MESSAGE),
  body('newPassword').optional().matches(PASSWORD_REGEX).withMessage(PASSWORD_POLICY_MESSAGE),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      const pwd = req.body.newPassword || req.body.password
      return !value || value === pwd
    })
    .withMessage('Passwords do not match'),
  body().custom((_, { req }) => {
    if (!req.body.token && !req.body.resetToken) {
      throw new Error('Reset token is required')
    }
    if (!req.body.newPassword && !req.body.password) {
      throw new Error('New password is required')
    }
    return true
  }),
  handleValidationErrors,
]

export const verifyEmailValidators = [
  body('verificationToken').optional().trim().isLength({ min: 16, max: 256 }),
  body('token').optional().trim().isLength({ min: 16, max: 256 }),
  body().custom((_, { req }) => {
    if (!req.body.verificationToken && !req.body.token) {
      throw new Error('Verification token is required')
    }
    return true
  }),
  handleValidationErrors,
]

export const resendVerificationValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  handleValidationErrors,
]

export const changePasswordValidators = [
  body('currentPassword').isLength({ min: 8, max: 128 }),
  body('newPassword').matches(PASSWORD_REGEX).withMessage(PASSWORD_POLICY_MESSAGE),
  handleValidationErrors,
]

export const contactValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }).escape(),
  body('email').trim().isEmail().normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(uzPhonePattern)
    .withMessage('Invalid phone number'),
  body('message').trim().isLength({ min: 10, max: 2000 }).escape(),
  handleValidationErrors,
]

export const cartAddValidators = [
  body('productId').isMongoId().withMessage('Invalid product id'),
  body('quantity').optional().isInt({ min: 1, max: 99 }).toInt(),
  body('color').optional().trim().isLength({ max: 80 }).escape(),
  handleValidationErrors,
]

export const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
]

export const paginationQueryValidators = [
  query('page').optional().isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,
]

export const searchQueryValidators = [
  query('search').optional().trim().isLength({ max: 120 }).escape(),
  query('query').optional().trim().isLength({ max: 120 }).escape(),
  handleValidationErrors,
]
