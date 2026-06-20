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
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(uzPhonePattern)
    .withMessage('Invalid phone number format'),
  body('name').optional().trim().isLength({ min: 2, max: 120 }).escape(),
  body('firstName').optional().trim().isLength({ min: 1, max: 60 }).escape(),
  body('lastName').optional().trim().isLength({ min: 1, max: 60 }).escape(),
  handleValidationErrors,
]

export const forgotPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  handleValidationErrors,
]

export const resetPasswordValidators = [
  body('token').trim().notEmpty().isLength({ max: 256 }),
  body('password').matches(PASSWORD_REGEX).withMessage(PASSWORD_POLICY_MESSAGE),
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
