import { z } from 'zod'
import { getPaymeStatus, isClickConfigured, isUzumBankConfigured } from '../config/payments.js'
import { logApp } from './appLogger.js'

const mongoUriSchema = z
  .string()
  .min(1)
  .refine((uri) => uri !== 'memory', 'MONGODB_URI cannot be "memory" in production')
  .refine(
    (uri) => /^mongodb(\+srv)?:\/\//.test(uri),
    'MONGODB_URI must start with mongodb:// or mongodb+srv://'
  )

const httpsUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('https://'), 'URL must use https:// in production')

const productionSchema = z.object({
  NODE_ENV: z.literal('production'),
  MONGODB_URI: mongoUriSchema,
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REFRESH_SECRET: z.string().min(32, 'REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  CLIENT_URL: httpsUrlSchema,
  CORS_ORIGIN: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : []
    )
    .refine(
      (origins) => origins.every((o) => o.startsWith('https://')),
      'All CORS_ORIGIN entries must use https:// in production'
    ),
  SEED_SUPER_ADMIN: z.enum(['true', 'false']).default('false'),
  SEED_ADMIN_DATA: z.enum(['true', 'false']).default('false'),
  PORT: z.coerce.number().int().positive().optional(),
  HOST: z.string().optional(),
})

const developmentSchema = z.object({
  NODE_ENV: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  CLIENT_URL: z.string().url().optional().or(z.literal('')),
})

/**
 * Validate environment variables. Throws with readable message on failure.
 * @returns {import('zod').infer<typeof productionSchema> | import('zod').infer<typeof developmentSchema>}
 */
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production'
  const raw = { ...process.env }

  if (isProduction) {
    const result = productionSchema.safeParse(raw)
    if (!result.success) {
      const details = result.error.issues
        .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
        .join('\n')
      throw new Error(`Production environment validation failed:\n${details}`)
    }
    return result.data
  }

  developmentSchema.safeParse(raw)
  return raw
}

/** Log safe config summary (no secrets). */
export function logEnvConfig() {
  const isProd = process.env.NODE_ENV === 'production'
  const corsList = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [process.env.CLIENT_URL].filter(Boolean)

  const mongoLabel = process.env.MONGODB_URI?.startsWith('mongodb+srv://')
    ? 'Atlas (mongodb+srv)'
    : process.env.MONGODB_URI === 'memory'
      ? 'in-memory (dev)'
      : process.env.MONGODB_URI?.startsWith('mongodb://')
        ? 'MongoDB (local/remote)'
        : '(not set)'

  const payme = getPaymeStatus()

  logApp('info', '[env] Configuration loaded', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    HOST: process.env.HOST || (isProd ? '127.0.0.1' : '0.0.0.0'),
    MONGODB_URI: mongoLabel,
    JWT_SECRET: process.env.JWT_SECRET ? `[set, ${process.env.JWT_SECRET.length} chars]` : '[missing]',
    REFRESH_SECRET: process.env.REFRESH_SECRET
      ? `[set, ${process.env.REFRESH_SECRET.length} chars]`
      : '[missing]',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    CLIENT_URL: process.env.CLIENT_URL || '(not set)',
    CORS_ORIGINS: corsList.join(', ') || '(none)',
    SEED_SUPER_ADMIN: process.env.SEED_SUPER_ADMIN || 'false',
    SEED_ADMIN_DATA: process.env.SEED_ADMIN_DATA || 'false',
    PAYME: payme.configured ? 'configured' : 'not configured',
    PAYME_TEST_MODE: payme.testMode,
    PAYME_WEBHOOK: payme.configured ? payme.webhookUrl : undefined,
    CLICK: isClickConfigured() ? 'configured' : 'not configured',
    UZUMBANK: isUzumBankConfigured() ? 'configured' : 'not configured',
  })

  if (!payme.configured && isProd) {
    logApp('warn', '[env] Payme credentials missing — set PAYME_MERCHANT_ID + PAYME_MERCHANT_KEY in server/.env')
  }
}

/**
 * Parse CORS_ORIGIN + CLIENT_URL into allowed origin list.
 */
export function getCorsOrigins() {
  const fromEnv = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : []

  const client = process.env.CLIENT_URL?.trim()
  const merged = [...new Set([...fromEnv, client].filter(Boolean))]

  if (process.env.NODE_ENV !== 'production') {
    return [
      ...merged,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]
  }

  return merged
}
