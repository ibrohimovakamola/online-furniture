import 'dotenv/config'
import app from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { runBootstrapSeeds } from './utils/bootstrapSeeds.js'
import { ensureDefaultCategories } from './utils/seedCategories.js'
import { isMemoryDbMode } from './config/db.js'

const DEFAULT_PORT = Number(process.env.PORT) || 5000
const MAX_PORT_ATTEMPTS = 6

/** @type {import('http').Server | null} */
let httpServer = null

function listenOnPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve({ server, port }))

    server.on('error', (err) => {
      server.close(() => {})
      reject(err)
    })
  })
}

async function startHttpServer(preferredPort) {
  let lastError = null

  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = preferredPort + offset

    try {
      const result = await listenOnPort(port)
      httpServer = result.server

      if (port !== preferredPort) {
        console.warn(
          `[server] Port ${preferredPort} is in use — listening on ${port}. ` +
            'Stop the old process (npm run kill-port) or update the Vite proxy target.'
        )
      }

      return port
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        lastError = err
        continue
      }
      throw err
    }
  }

  console.error(
    `[server] Ports ${preferredPort}-${preferredPort + MAX_PORT_ATTEMPTS - 1} are in use. ` +
      'Run: cd server && npm run kill-port'
  )
  throw lastError || new Error('No available port')
}

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down`)
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(() => resolve()))
  }
  await disconnectDB()
  process.exit(0)
}

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment')
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment')
  }

  try {
    await connectDB(process.env.MONGODB_URI)
  } catch (err) {
    console.error('[server] Database connection failed:', err.message)
    console.error(
      '[server] For local dev use MONGODB_URI=memory in server/.env. ' +
        'If memory DB fails, free disk space on C: or use a real MongoDB URI.'
    )
    process.exit(1)
  }

  // Force original 7 categories when collection is empty (memory DB resets on restart)
  try {
    const categoryResult = await ensureDefaultCategories()
    if (categoryResult?.total === 0) {
      console.error('[startup] WARNING: No categories in database after seed — check MongoDB connection')
    }
  } catch (err) {
    console.error('[startup] Category seed failed:', err.message)
  }

  try {
    await runBootstrapSeeds()
  } catch (err) {
    console.error('[server] Bootstrap seed failed (server will still start):', err.message)
  }

  if (isMemoryDbMode()) {
    console.log(
      '[server] Tip: use mongodb://127.0.0.1:27017/exclusive in .env for data that survives restarts'
    )
  }

  const port = await startHttpServer(DEFAULT_PORT)
  console.log(`Server listening on http://localhost:${port}`)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

start().catch((err) => {
  console.error('Failed to start server:', err.message)
  process.exit(1)
})
