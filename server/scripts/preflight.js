#!/usr/bin/env node
/**
 * Production preflight — validate env, DB connectivity, optional payment/email probes.
 *
 *   cd server && cp .env.production.example .env   # fill real values first
 *   node scripts/preflight.js
 */
import '../src/utils/loadEnvBootstrap.js'
import { validateEnv } from '../src/utils/validateEnv.js'
import { connectDB, disconnectDB, pingDatabase } from '../src/config/db.js'
import { isPaymeConfigured, isClickConfigured } from '../src/config/payments.js'
import { logApp } from '../src/utils/appLogger.js'

function check(name, ok, detail = '') {
  const status = ok ? 'OK' : 'FAIL'
  logApp(ok ? 'info' : 'error', `[preflight] ${name}: ${status}${detail ? ` — ${detail}` : ''}`)
  return ok
}

async function main() {
  let passed = true

  try {
    validateEnv()
    passed = check('Environment validation', true) && passed
  } catch (err) {
    passed = check('Environment validation', false, err.message) && passed
  }

  const uri = process.env.MONGODB_URI
  if (!uri || uri === 'memory') {
    passed = check('MONGODB_URI', false, 'must be Atlas/production URI') && passed
  } else {
    try {
      await connectDB(uri)
      const alive = await pingDatabase()
      passed = check('MongoDB connection', alive) && passed
      await disconnectDB()
    } catch (err) {
      passed = check('MongoDB connection', false, err.message) && passed
    }
  }

  passed = check('JWT_SECRET length', (process.env.JWT_SECRET || '').length >= 32) && passed
  passed = check('REFRESH_SECRET length', (process.env.REFRESH_SECRET || '').length >= 32) && passed
  passed = check('CORS_ORIGIN https', (process.env.CORS_ORIGIN || '').includes('https://')) && passed

  if (!isPaymeConfigured()) {
    logApp('warn', '[preflight] Payme not configured — Payme checkout disabled')
  }
  if (!isClickConfigured()) {
    logApp('warn', '[preflight] Click not configured')
  }

  const hasEmail =
    (process.env.SMTP_HOST && process.env.SMTP_USER) ||
    (process.env.EMAIL_SERVICE && process.env.EMAIL_USER)
  check('Email SMTP', Boolean(hasEmail), hasEmail ? '' : 'emails log to console only')

  if (!passed) {
    logApp('error', '[preflight] One or more checks failed.')
    process.exit(1)
  }

  logApp('info', '[preflight] All critical checks passed.')
}

main().catch((err) => {
  logApp('error', '[preflight] Unexpected error', { message: err.message })
  process.exit(1)
})
