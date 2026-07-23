import './utils/loadEnvBootstrap.js'
import { startMemoryMonitor, stopMemoryMonitor } from './utils/devMemoryMonitor.js'
import { validateEnv, logEnvConfig } from './utils/validateEnv.js'
import { logCorsConfig } from './config/cors.js'
import { logAppError } from './utils/winstonLogger.js'
import { logApp } from './utils/appLogger.js'
import app from './app.js'
import { connectDB, disconnectDB, getDbStatus, isDbConnected, pingDatabase } from './config/db.js'
import { productionConfig, assertProductionEnv } from './config/production.js'
import { runBootstrapSeeds } from './utils/bootstrapSeeds.js'
import { ensureDefaultCategories } from './utils/seedCategories.js'

const PORT = Number(process.env.PORT) || 5000
// Render/Railway require 0.0.0.0; VPS behind Nginx can set HOST=127.0.0.1 in .env
const HOST = process.env.HOST || '0.0.0.0'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const DB_RETRY_ATTEMPTS = Number(process.env.DB_RETRY_ATTEMPTS) || 3
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS) || 2000

let httpServer = null
let productionDbMonitor = null

function applyDevEnvDefaults() {
  try {
    validateEnv()
    logEnvConfig()
    logCorsConfig()
  } catch (err) {
    logApp('error', '[env] Validation failed', { message: err.message })
    process.exit(1)
  }

  if (IS_PRODUCTION) {
    const missing = assertProductionEnv()
    if (missing.length > 0) {
      logApp('warn', '[server] Production env gaps', { missing })
    }
    return
  }

  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'memory'
    logApp('warn', '[server] MONGODB_URI missing — using memory')
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-jwt-secret-replace-in-production'
    logApp('warn', '[server] JWT_SECRET missing — using dev default')
  }
  if (!process.env.REFRESH_SECRET) {
    process.env.REFRESH_SECRET =
      process.env.JWT_SECRET.length >= 32
        ? process.env.JWT_SECRET
        : 'dev-only-refresh-secret-min-32-characters-long'
    logApp('warn', '[server] REFRESH_SECRET missing — using dev default')
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Periodic MongoDB ping in production — surfaces lag / disconnects in logs. */
function startProductionDbMonitor() {
  if (!IS_PRODUCTION || productionDbMonitor) return

  productionDbMonitor = setInterval(async () => {
    const started = Date.now()
    const ok = await pingDatabase(productionConfig.mongoConnectionTimeoutMs)
    const ms = Date.now() - started
    if (ok) {
      logApp('info', `[server] MongoDB health ping: ${ms}ms`)
    } else {
      logApp('error', '[server] MongoDB health ping failed')
    }
  }, productionConfig.dbHealthIntervalMs)

  productionDbMonitor.unref?.()
}

function stopProductionDbMonitor() {
  if (productionDbMonitor) {
    clearInterval(productionDbMonitor)
    productionDbMonitor = null
  }
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI
  const label = uri === 'memory' ? 'in-memory (dev)' : uri.startsWith('mongodb+srv://') ? 'Atlas' : 'local/remote'
  logApp('info', `[server] Connecting to MongoDB (${label})…`)

  let lastError = null

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        logApp('info', `[server] DB retry ${attempt}/${DB_RETRY_ATTEMPTS}…`)
      }
      await connectDB(uri)
      await ensureDefaultCategories()
      await runBootstrapSeeds()
      const dbName = getDbStatus().database || 'kresla'
      logApp('info', `[server] MongoDB connected and seeded (database: ${dbName})`)
      if (IS_PRODUCTION) {
        startProductionDbMonitor()
      }
      if (!IS_PRODUCTION) {
        logApp('info', '[server] Dev admin: admin@kresla.uz / ChangeMe123!')
      } else if (process.env.SEED_SUPER_ADMIN === 'true') {
        logApp('warn', '[server] Super admin seeded — change password after first login')
      }
      return
    } catch (err) {
      lastError = err
      logApp('error', `[server] Database attempt ${attempt}/${DB_RETRY_ATTEMPTS} failed`, {
        message: err.message,
      })
      if (attempt < DB_RETRY_ATTEMPTS) {
        await sleep(DB_RETRY_DELAY_MS)
      }
    }
  }

  throw lastError || new Error('Database connection failed')
}

function printDbTroubleshooting() {
  logApp('error', '[server] Could not connect to MongoDB — check MONGODB_URI in server/.env')
}

async function startHttpServer() {
  await new Promise((resolve, reject) => {
    httpServer = app.listen(PORT, HOST, () => {
      const { connected, state } = getDbStatus()
      logApp('info', `[server] HTTP listening on http://${HOST}:${PORT}`, {
        database: connected ? 'connected' : state,
      })
      resolve()
    })
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logApp('error', `[server] Port ${PORT} in use`)
      }
      reject(err)
    })
  })
}

async function start() {
  applyDevEnvDefaults()
  startMemoryMonitor()

  // Listen immediately in dev so Vite proxy works while MongoDB (memory-server) boots
  if (!IS_PRODUCTION) {
    await startHttpServer()
    connectDatabase().catch((err) => {
      logApp('warn', '[server] Background DB connect failed — API returns 503 until ready', {
        message: err.message,
      })
    })
    return
  }

  try {
    await connectDatabase()
  } catch (err) {
    printDbTroubleshooting()
    logApp('error', '[server] Refusing to start without a database in production', { message: err.message })
    process.exit(1)
  }

  if (isDbConnected() === false) {
    logApp('error', '[server] Database disconnected after connect — aborting startup')
    process.exit(1)
  }

  await startHttpServer()
}

async function shutdown() {
  stopProductionDbMonitor()
  stopMemoryMonitor()
  if (httpServer) await new Promise((r) => httpServer.close(() => r()))
  await disconnectDB()
  process.exit(0)
}

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

process.on('uncaughtException', (err) => {
  logAppError({
    errorId: 'ERR-UNCAUGHT',
    statusCode: 500,
    message: err?.message || 'Uncaught exception',
    stack: err?.stack,
    isOperational: false,
  })
  shutdown().catch(() => process.exit(1))
})

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : undefined
  logAppError({
    errorId: 'ERR-UNHANDLED',
    statusCode: 500,
    message: `Unhandled rejection: ${message}`,
    stack,
    isOperational: false,
  })
})

start().catch((err) => {
  logApp('error', '[server] Failed to start', { message: err.message })
  process.exit(1)
})
