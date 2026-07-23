import cors from 'cors'
import { getCorsOrigins } from '../utils/validateEnv.js'
import { logApp } from '../utils/appLogger.js'

/**
 * Browser storefront origins (production defaults when CORS_ORIGIN is unset).
 * Override via CORS_ORIGIN comma-separated env on Render.
 */
export const DEFAULT_STOREFRONT_ORIGINS = [
  'https://mebelsotish.uz',
  'https://www.mebelsotish.uz',
]

/** Local Vite dev servers — always allowed outside production. */
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

/**
 * Payme / Click / Uzum Bank call the API server-to-server (no browser, no Origin).
 * CORS does not apply to those requests, but we skip the cors middleware on these
 * paths so a mistaken Origin header from a gateway never hits the whitelist.
 */
const PAYMENT_WEBHOOK_PATH =
  /^\/api\/(?:payments?\/(?:payme|click|uzumbank)(?:\/callback|-callback|\/webhook)|payments\/(?:payme-callback|click-callback|uzumbank-callback))/

export function isPaymentWebhookPath(pathname = '') {
  const path = String(pathname).split('?')[0]
  return PAYMENT_WEBHOOK_PATH.test(path)
}

function allowVercelPreviewOrigins() {
  return process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true'
}

/**
 * @param {string | undefined} origin
 * @param {Set<string>} exactOrigins
 */
export function isOriginAllowed(origin, exactOrigins) {
  // curl, Postman, payment gateways, health probes — no Origin header
  if (!origin) return true

  if (exactOrigins.has(origin)) return true

  // Optional: Vercel preview deployments (*.vercel.app)
  if (allowVercelPreviewOrigins()) {
    try {
      const { protocol, hostname } = new URL(origin)
      if (protocol === 'https:' && hostname.endsWith('.vercel.app')) {
        return true
      }
    } catch {
      /* ignore malformed origin */
    }
  }

  return false
}

/**
 * Build the exact-origin whitelist from env (CORS_ORIGIN + CLIENT_URL) plus defaults.
 */
export function buildAllowedOriginSet() {
  const fromEnv = getCorsOrigins()
  const merged = new Set([
    ...DEFAULT_STOREFRONT_ORIGINS,
    ...fromEnv,
    ...(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS),
  ])
  return merged
}

/**
 * Express CORS options — credentials, methods, headers, preflight (OPTIONS).
 */
export function getCorsOptions() {
  const exactOrigins = buildAllowedOriginSet()
  const credentials = process.env.CORS_CREDENTIALS !== 'false'

  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, exactOrigins)) {
        callback(null, true)
        return
      }

      if (process.env.NODE_ENV === 'development') {
        logApp('warn', `[cors] Blocked browser origin: ${origin}`, {
          allowed: [...exactOrigins].join(', '),
          vercelPreviews: allowVercelPreviewOrigins(),
        })
      }

      // Reject without throwing — browser shows a CORS error; no 500 in API logs
      callback(null, false)
    },
    credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  }
}

const corsHandler = cors(getCorsOptions())

/**
 * Apply CORS to browser-facing routes only.
 * Payment webhooks skip CORS entirely (server-to-server).
 */
export function corsMiddleware(req, res, next) {
  if (isPaymentWebhookPath(req.path)) {
    return next()
  }
  return corsHandler(req, res, next)
}

/** Log effective CORS policy once at startup (no secrets). */
export function logCorsConfig() {
  const exactOrigins = buildAllowedOriginSet()
  logApp('info', '[cors] Policy loaded', {
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    origins: [...exactOrigins].join(', '),
    vercelPreviews: allowVercelPreviewOrigins(),
    paymentWebhooksSkipCors: true,
  })
}
