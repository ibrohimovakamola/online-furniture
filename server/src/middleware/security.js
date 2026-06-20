import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { inHTMLData } from 'xss-filters'
import { logApp } from '../utils/appLogger.js'



const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'



const mongoSanitizeOptions = {

  replaceWith: '_',

  onSanitize: ({ req, key }) => {

    if (!isProduction) {
      logApp('warn', `[sanitize] Stripped prohibited key "${key}"`, { method: req.method, path: req.path })
    }

  },

}



/** Mutate read-only Express 5 req.query / req.params without reassignment. */

function replaceObjectContents(target, source) {

  for (const key of Object.keys(target)) {

    if (!(key in source)) delete target[key]

  }

  Object.assign(target, source)

}



function sanitizeMongoInPlace(value) {

  if (!value || typeof value !== 'object') return

  mongoSanitize.sanitize(value, mongoSanitizeOptions)

}



function cleanXss(value) {

  if (value == null) return value



  if (typeof value === 'object') {

    const cleaned = JSON.parse(inHTMLData(JSON.stringify(value)).trim())

    return cleaned

  }



  return inHTMLData(String(value)).trim()

}



function applyXssInPlace(target) {

  if (!target || typeof target !== 'object') return

  replaceObjectContents(target, cleanXss(target))

}



/**

 * Strip MongoDB operator keys ($gt, $where, etc.) from body, query, params.

 * express-mongo-sanitize reassigns req.query, which throws on Express 5.

 */

export function mongoSanitizeMiddleware(req, _res, next) {

  try {

    sanitizeMongoInPlace(req.body)

    sanitizeMongoInPlace(req.params)

    sanitizeMongoInPlace(req.query)

    next()

  } catch (err) {

    next(err)

  }

}



/** Encode common XSS payloads in req.body, query, params (Express 5 safe). */

export function xssCleanMiddleware(req, _res, next) {

  try {

    if (req.body) req.body = cleanXss(req.body)

    applyXssInPlace(req.query)

    applyXssInPlace(req.params)

    next()

  } catch (err) {

    next(err)

  }

}



/** Paths excluded from the global API rate limit (webhooks, health probes). */

const API_LIMITER_SKIP = new Set([

  '/api/health',

  '/api-docs',

  '/api-docs.json',

  '/api/payment/payme/webhook',

  '/api/payments/payme/webhook',

  '/api/payments/payme-callback',

  '/api/payments/click-callback',

  '/api/payments/click/callback',

])



export const helmetMiddleware = helmet({

  contentSecurityPolicy: isProduction

    ? {

        directives: {

          defaultSrc: ["'self'"],

          styleSrc: ["'self'", "'unsafe-inline'"],

          scriptSrc: ["'self'"],

          imgSrc: ["'self'", 'data:', 'https:'],

          connectSrc: ["'self'"],

          fontSrc: ["'self'", 'https:', 'data:'],

          objectSrc: ["'none'"],

          frameAncestors: ["'none'"],

          upgradeInsecureRequests: [],

        },

      }

    : false,

  crossOriginResourcePolicy: { policy: 'cross-origin' },

  hsts: isProduction

    ? { maxAge: 31536000, includeSubDomains: true, preload: true }

    : false,

  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  xContentTypeOptions: true,

  xFrameOptions: { action: 'deny' },

})



/** Redirect HTTP → HTTPS in production (requires trust proxy). */

export function httpsRedirect(req, res, next) {

  if (!isProduction || process.env.FORCE_HTTPS === 'false') return next()



  const proto = req.headers['x-forwarded-proto']

  if (proto && proto !== 'https') {

    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`)

  }

  next()

}



/** General API throttle — 100 requests / hour per IP */

export const apiLimiter = rateLimit({

  windowMs: 60 * 60 * 1000,

  max: Number(process.env.API_RATE_LIMIT_MAX) || 100,

  standardHeaders: true,

  legacyHeaders: false,

  message: { success: false, message: 'Too many requests from this IP. Try again later.' },

  skip: (req) => isTest || API_LIMITER_SKIP.has(req.path),

})



/** Brute-force protection for login — 5 attempts / 15 min per IP */

export const authLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: isTest ? 10_000 : Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,

  standardHeaders: true,

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: { success: false, message: 'Too many login attempts. Try again later.' },

})



/** Password reset throttle — 3 requests / hour per IP */

export const passwordResetLimiter = rateLimit({

  windowMs: 60 * 60 * 1000,

  max: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3,

  standardHeaders: true,

  legacyHeaders: false,

  message: { success: false, message: 'Too many password reset requests. Try again later.' },

})



/** Stricter limit for contact/public forms */

export const contactLimiter = rateLimit({

  windowMs: 60 * 60 * 1000,

  max: Number(process.env.CONTACT_RATE_LIMIT_MAX) || 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: { success: false, message: 'Too many submissions. Try again later.' },

})


