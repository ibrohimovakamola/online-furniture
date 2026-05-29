import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {MongoMemoryServer | null} */
let memoryServer = null

const PLACEHOLDER_MARKERS = ['YOUR_DB_USER', 'YOUR_DB_PASSWORD', 'YOUR_CLUSTER']

function isPlaceholderUri(uri) {
  return PLACEHOLDER_MARKERS.some((marker) => uri.includes(marker))
}

export function isMemoryDbMode(uri = process.env.MONGODB_URI) {
  return uri === 'memory' || process.env.USE_MEMORY_DB === 'true' || isPlaceholderUri(uri || '')
}

function shouldUseMemoryDb(uri) {
  return isMemoryDbMode(uri)
}

/**
 * Persistent folder for in-memory MongoDB — survives Node restarts when mongod can reuse dbPath.
 * Never delete this folder on boot; only clear stale lock files.
 */
function getMemoryDbPath() {
  if (process.env.MEMORY_DB_PERSIST === 'false') return undefined

  const localPath = path.join(__dirname, '../../.mongo-memory')
  try {
    fs.mkdirSync(localPath, { recursive: true })
    return localPath
  } catch {
    return undefined
  }
}

/** Remove stale lock only — do NOT wipe the data directory on restart */
function clearStaleLockFile(dbPath) {
  if (!dbPath) return

  const lockFile = path.join(dbPath, 'mongod.lock')
  if (!fs.existsSync(lockFile)) return

  try {
    fs.unlinkSync(lockFile)
    console.log('[db] Cleared stale mongod.lock (data directory preserved)')
  } catch (err) {
    console.warn('[db] Could not remove mongod.lock:', err.message)
  }
}

async function startMemoryServer() {
  const dbPath = getMemoryDbPath()

  if (dbPath) {
    clearStaleLockFile(dbPath)
    let hasData = false
    try {
      const files = fs.readdirSync(dbPath)
      hasData = files.some(
        (f) => f.endsWith('.wt') || f === 'storage.bson' || f === 'journal' || f === 'collection'
      )
    } catch {
      hasData = false
    }

    if (hasData) {
      console.log('[db] Reusing persisted in-memory data at server/.mongo-memory')
    }
  }

  try {
    memoryServer = await MongoMemoryServer.create({
      instance: dbPath ? { dbPath } : undefined,
    })
    return memoryServer.getUri('exclusive')
  } catch (err) {
    if (dbPath) {
      console.warn('[db] Persisted memory DB failed, starting ephemeral instance:', err.message)
      clearStaleLockFile(dbPath)
      try {
        memoryServer = await MongoMemoryServer.create()
        return memoryServer.getUri('exclusive')
      } catch (retryErr) {
        console.error('[db] In-memory MongoDB retry failed:', retryErr.message)
      }
    }

    console.error('[db] In-memory MongoDB failed to start:', err.message)
    console.error(
      '[db] Free disk space on C: or set MONGODB_URI to mongodb://127.0.0.1:27017/exclusive for local MongoDB'
    )
    throw err
  }
}

export async function connectDB(uri) {
  mongoose.set('strictQuery', true)

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  let connectionUri = uri

  if (shouldUseMemoryDb(uri)) {
    if (isPlaceholderUri(uri)) {
      console.warn(
        'MONGODB_URI still contains template placeholders — starting in-memory MongoDB instead.'
      )
    }

    connectionUri = await startMemoryServer()
    console.log(
      '[db] In-memory MongoDB ready. Data persists across restarts in server/.mongo-memory when possible.'
    )
    console.log('[db] Categories/products still re-seed on empty collections after each boot.')
    console.log(`[db] Dev URI: ${connectionUri}`)
  }

  const isAtlas = connectionUri.startsWith('mongodb+srv://')

  try {
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: isAtlas ? 15000 : 8000,
    })
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
    return mongoose.connection
  } catch (err) {
    if (isAtlas) {
      console.error(
        'Atlas connection failed. Check MONGODB_URI, credentials, and IP whitelist. ' +
          'Or set MONGODB_URI=memory for local dev.'
      )
    }
    throw err
  }
}

export async function disconnectDB() {
  await mongoose.disconnect().catch(() => {})
  if (memoryServer) {
    await memoryServer.stop().catch(() => {})
    memoryServer = null
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1
}
