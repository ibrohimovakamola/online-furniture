import './utils/loadEnvBootstrap.js'
import { validateEnv, logEnvConfig } from './utils/validateEnv.js'
import { logAppError } from './utils/winstonLogger.js'
import { logApp } from './utils/appLogger.js'
import app from './app.js'
import { connectDB, disconnectDB, getDbStatus, isDbConnected } from './config/db.js'
import { runBootstrapSeeds } from './utils/bootstrapSeeds.js'
import { ensureDefaultCategories } from './utils/seedCategories.js'

const PORT = Number(process.env.PORT) || 5000
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0')
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const DB_RETRY_ATTEMPTS = Number(process.env.DB_RETRY_ATTEMPTS) || 3
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS) || 2000

let httpServer = null

function applyDevEnvDefaults() {
  try {
    validateEnv()
    logEnvConfig()
  } catch (err) {
    logApp('error', '[env] Validation failed', { message: err.message })
    process.exit(1)
  }

  if (IS_PRODUCTION) {
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
      logApp('info', '[server] MongoDB connected and seeded')
      if (!IS_PRODUCTION) {
        logApp('info', '[server] Dev admin: admin@exclusive.uz / ChangeMe123!')
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

  try {
    await connectDatabase()
  } catch (err) {
    printDbTroubleshooting()
    if (IS_PRODUCTION) {
      logApp('error', '[server] Refusing to start without a database in production', { message: err.message })
      process.exit(1)
    }
    logApp('warn', '[server] Starting in degraded mode — API returns 503 until MongoDB connects')
  }

  if (isDbConnected() === false && IS_PRODUCTION) {
    logApp('error', '[server] Database disconnected after connect — aborting startup')
    process.exit(1)
  }

  await startHttpServer()
}

async function shutdown() {
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
