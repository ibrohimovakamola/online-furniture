/**
 * Production defaults and helpers.
 * Env vars in server/.env override these at runtime.
 */

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN || process.env.CLIENT_URL || ''
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export const productionConfig = {
  nodeEnv: 'production',
  mongoConnectionTimeoutMs: Number(process.env.MONGO_CONNECTION_TIMEOUT_MS) || 30_000,
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: parseCorsOrigins(),
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  apiRateLimitWindowMs: 15 * 60 * 1000,
  errorLogging: process.env.ERROR_LOGGING || 'file',
  dbHealthIntervalMs: Number(process.env.DB_HEALTH_INTERVAL_MS) || 60_000,
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production'
}

export function assertProductionEnv() {
  const missing = []
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'memory') {
    missing.push('MONGODB_URI (Atlas or remote — not memory)')
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET (min 32 chars)')
  }
  if (!process.env.REFRESH_SECRET || process.env.REFRESH_SECRET.length < 32) {
    missing.push('REFRESH_SECRET (min 32 chars)')
  }
  if (productionConfig.corsOrigins.length === 0) {
    missing.push('CORS_ORIGIN or CLIENT_URL')
  }
  return missing
}
