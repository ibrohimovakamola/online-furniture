import fs from 'fs'
import os from 'os'
import path from 'path'
import net from 'net'
import { spawn, execSync } from 'child_process'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { logApp } from '../utils/appLogger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {MongoMemoryServer | null} */
let memoryServer = null
/** @type {import('child_process').ChildProcess | null} */
let spawnedMongod = null

let dbStatus = { state: 'disconnected', error: null, uri: null }

const PLACEHOLDER_MARKERS = ['YOUR_DB_USER', 'YOUR_DB_PASSWORD', 'YOUR_CLUSTER']
const DEV_MONGO_PORT = Number(process.env.DEV_MONGO_PORT) || 27017
const LOCAL_FALLBACK_URI = `mongodb://127.0.0.1:${DEV_MONGO_PORT}/exclusive`
const MONGOD_VERSION = process.env.MONGOD_VERSION || '7.0.14'
const MIN_MONGOD_BYTES = 50_000_000
const MIN_FREE_BYTES = 200 * 1024 * 1024

const MONGO_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 8000,
  maxPoolSize: 10,
}

function logDb(level, message, detail) {
  const meta = detail !== undefined ? { detail } : undefined
  logApp(level === 'error' ? 'error' : 'info', `[db] ${message}`, meta)
}

function isPlaceholderUri(uri) {
  return PLACEHOLDER_MARKERS.some((marker) => uri.includes(marker))
}

export function isMemoryDbMode(uri = process.env.MONGODB_URI) {
  return uri === 'memory' || process.env.USE_MEMORY_DB === 'true' || isPlaceholderUri(uri || '')
}

function shouldUseMemoryDb(uri) {
  return isMemoryDbMode(uri)
}

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

function getDriveFreeBytes(targetPath) {
  try {
    if (process.platform === 'win32') {
      const root = path.parse(targetPath).root.replace(/\\$/, '')
      const letter = root.charAt(0)
      if (!letter) return Infinity
      const out = execSync(
        `powershell -NoProfile -Command "(Get-PSDrive -Name '${letter}').Free"`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      )
      const free = Number(out.trim())
      return Number.isFinite(free) ? free : Infinity
    }
    const stat = fs.statfsSync(targetPath)
    return stat.bavail * stat.bsize
  } catch {
    return Infinity
  }
}

/** Prefer D: (or DEV_MONGO_DATA_DIR) when C: is nearly full — MongoDB needs hundreds of MB. */
function getDevMongoDataRoot() {
  if (process.env.DEV_MONGO_DATA_DIR?.trim()) {
    return path.resolve(process.env.DEV_MONGO_DATA_DIR.trim())
  }

  const cFree = getDriveFreeBytes(process.cwd())
  const dRoot = process.platform === 'win32' ? 'D:\\.exclusive-dev-mongo' : null

  if (dRoot && fs.existsSync('D:\\')) {
    const dFree = getDriveFreeBytes(dRoot)
    if (cFree < MIN_FREE_BYTES && dFree > MIN_FREE_BYTES) {
      return dRoot
    }
    if (dFree > cFree && dFree > MIN_FREE_BYTES) {
      return dRoot
    }
  }

  return path.join(os.tmpdir(), 'exclusive-mongo-dev')
}

function getMongodCacheDirs() {
  const dataRoot = getDevMongoDataRoot()
  const dirs = [path.join(dataRoot, 'binaries'), path.join(os.homedir(), '.cache', 'mongodb-binaries')]
  return [...new Set(dirs)]
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function validateMongodBinary(binaryPath) {
  try {
    execSync(`"${binaryPath}" --version`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    })
    return true
  } catch (err) {
    const code = err.status ?? err.code
    if (code === 3221225781 || code === -1073741515) {
      throw new Error(
        'MongoDB binary cannot start — install Microsoft Visual C++ Redistributable (x64): ' +
          'https://aka.ms/vs/17/release/vc_redist.x64.exe then restart the backend.'
      )
    }
    return false
  }
}

function findCachedMongodBinary() {
  for (const cacheDir of getMongodCacheDirs()) {
    if (!fs.existsSync(cacheDir)) continue

    const candidates = fs
      .readdirSync(cacheDir)
      .filter((name) => /^mongod.*\.exe$/i.test(name) || /^mongod/i.test(name))
      .map((name) => path.join(cacheDir, name))
      .filter((fullPath) => {
        try {
          return fs.statSync(fullPath).size >= MIN_MONGOD_BYTES
        } catch {
          return false
        }
      })
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)

    for (const candidate of candidates) {
      if (validateMongodBinary(candidate)) {
        return candidate
      }
      logDb('log', `Skipping invalid mongod binary: ${path.basename(candidate)}`)
    }
  }

  return null
}

/** Download mongod via mongodb-memory-server when no cached binary exists. */
async function ensureMongodBinary() {
  const cached = findCachedMongodBinary()
  if (cached) {
    logDb('log', `Using cached mongod binary: ${path.basename(cached)}`)
    return cached
  }

  const downloadDir = ensureDir(path.join(getDevMongoDataRoot(), 'binaries'))
  const freeBytes = getDriveFreeBytes(downloadDir)
  if (freeBytes < MIN_FREE_BYTES) {
    throw new Error(
      `Not enough disk space for MongoDB download (${Math.round(freeBytes / 1024 / 1024)} MB free on ${downloadDir}). ` +
        'Free at least 1 GB or set DEV_MONGO_DATA_DIR to a drive with space (e.g. D:\\.exclusive-dev-mongo).'
    )
  }

  logDb('log', `No valid mongod found — downloading ${MONGOD_VERSION} to ${downloadDir}…`)
  const probe = await MongoMemoryServer.create({
    binary: { version: MONGOD_VERSION, downloadDir },
    instance: { launchTimeout: 180000 },
  })
  const binaryPath = probe.instanceInfo?.mongodPath || findCachedMongodBinary()
  await probe.stop().catch(() => {})
  if (!binaryPath) {
    throw new Error('Could not resolve mongod binary after download')
  }
  logDb('log', `Mongod binary ready: ${path.basename(binaryPath)}`)
  return binaryPath
}

function waitForPort(port, timeoutMs = 30000) {
  const started = Date.now()

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port })
      socket.once('connect', () => {
        socket.end()
        resolve()
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`MongoDB did not start on port ${port} within ${timeoutMs}ms`))
          return
        }
        setTimeout(tryConnect, 400)
      })
    }
    tryConnect()
  })
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

/** Kill whatever process holds a local port (Windows dev mongod recovery). */
function killProcessOnPort(port) {
  if (process.platform !== 'win32') return

  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' })
    const pids = [
      ...new Set(
        output
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => /^\d+$/.test(pid) && pid !== '0' && pid !== String(process.pid))
      ),
    ]

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        logDb('log', `Killed stale process PID ${pid} on port ${port}`)
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* no listener */
  }
}

async function pingMongoUri(uri, timeoutMs = 5000) {
  const conn = mongoose.createConnection(uri, {
    ...MONGO_CONNECT_OPTIONS,
    serverSelectionTimeoutMS: timeoutMs,
    socketTimeoutMS: timeoutMs,
  })

  try {
    await conn.asPromise()
    await conn.db.admin().ping()
  } finally {
    await conn.close().catch(() => {})
  }
}

async function spawnDevMongod() {
  if (spawnedMongod && !spawnedMongod.killed) {
    try {
      await pingMongoUri(LOCAL_FALLBACK_URI)
      logDb('log', `Reusing spawned mongod on port ${DEV_MONGO_PORT}`)
      return LOCAL_FALLBACK_URI
    } catch {
      spawnedMongod.kill()
      spawnedMongod = null
    }
  }

  const portOpen = await isPortListening(DEV_MONGO_PORT)
  if (portOpen) {
    try {
      await pingMongoUri(LOCAL_FALLBACK_URI)
      logDb('log', `Reusing healthy mongod on port ${DEV_MONGO_PORT}`)
      return LOCAL_FALLBACK_URI
    } catch (err) {
      logDb('log', `Port ${DEV_MONGO_PORT} open but not responding (${err.message}) — restarting…`)
      killProcessOnPort(DEV_MONGO_PORT)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  const mongodPath = await ensureMongodBinary()
  const dataRoot = ensureDir(getDevMongoDataRoot())
  const dbPath = path.join(dataRoot, `instance-${Date.now()}`)

  const freeBytes = getDriveFreeBytes(dataRoot)
  if (freeBytes < MIN_FREE_BYTES) {
    throw new Error(
      `Not enough disk space for MongoDB data (${Math.round(freeBytes / 1024 / 1024)} MB free). ` +
        'Free space on C: or set DEV_MONGO_DATA_DIR=D:\\.exclusive-dev-mongo in server/.env.'
    )
  }

  fs.mkdirSync(dbPath, { recursive: true })

  logDb('log', `Starting dev mongod: ${path.basename(mongodPath)} on port ${DEV_MONGO_PORT} (dbpath: ${dbPath})`)

  let stderrLog = ''

  spawnedMongod = spawn(
    mongodPath,
    [
      '--dbpath',
      dbPath,
      '--port',
      String(DEV_MONGO_PORT),
      '--bind_ip',
      '127.0.0.1',
      '--wiredTigerCacheSizeGB',
      '0.25',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
  )

  spawnedMongod.stderr?.on('data', (chunk) => {
    const msg = String(chunk)
    stderrLog += msg
    if (msg.includes('error') || msg.includes('Error') || msg.includes('FATAL') || msg.includes('fassert')) {
      logApp('error', '[db] mongod stderr', { message: msg.trim() })
    }
  })

  spawnedMongod.on('exit', (code) => {
    if (code && code !== 0) {
      logApp('error', '[db] Dev mongod exited', { code })
      if (stderrLog.trim()) {
        logApp('error', '[db] mongod output', { output: stderrLog.trim().slice(-500) })
      }
    }
    spawnedMongod = null
  })

  await waitForPort(DEV_MONGO_PORT)
  logDb('log', `Dev mongod ready at ${LOCAL_FALLBACK_URI}`)
  return LOCAL_FALLBACK_URI
}

async function createMemoryServer(dbPath) {
  const downloadDir = ensureDir(path.join(getDevMongoDataRoot(), 'binaries'))
  const ephemeralPath = dbPath || path.join(getDevMongoDataRoot(), `memory-${Date.now()}`)
  if (!dbPath) ensureDir(ephemeralPath)

  logDb('log', `Starting mongodb-memory-server${dbPath ? ' (persistent path)' : ' (ephemeral)'}…`)
  memoryServer = await MongoMemoryServer.create({
    binary: { version: MONGOD_VERSION, downloadDir },
    instance: {
      dbPath: ephemeralPath,
      launchTimeout: 180000,
    },
  })
  const uri = memoryServer.getUri('exclusive')
  logDb('log', `mongodb-memory-server ready at ${uri}`)
  return uri
}

/**
 * Resolve a dev MongoDB URI for MONGODB_URI=memory.
 * Order: mongodb-memory-server → spawned local mongod (Windows-friendly fallback).
 */
async function startMemoryServer() {
  const preferSpawn = process.env.USE_SPAWN_MONGOD === 'true'

  const dbPath = process.env.MEMORY_DB_PERSIST === 'false' ? undefined : getMemoryDbPath()
  const strategies = preferSpawn
    ? ['spawn', 'memory-server']
    : ['memory-server', 'spawn']

  logDb('log', `Dev DB strategies: ${strategies.join(' → ')}`)

  let lastError = null

  for (const strategy of strategies) {
    try {
      if (strategy === 'memory-server') {
        return await createMemoryServer(dbPath)
      }
      return await spawnDevMongod()
    } catch (err) {
      lastError = err
      console.error(`[db] ${strategy} failed:`, err.message)
    }
  }

  throw lastError || new Error('All dev MongoDB strategies failed')
}

let lifecycleLogsAttached = false

function attachMongooseLifecycleLogs() {
  if (lifecycleLogsAttached) return
  lifecycleLogsAttached = true

  mongoose.connection.on('connected', () => logDb('log', 'Mongoose event: connected'))
  mongoose.connection.on('disconnected', () => {
    logDb('log', 'Mongoose event: disconnected')
    if (dbStatus.state === 'connected') {
      dbStatus = { ...dbStatus, state: 'disconnected', error: 'Connection lost' }
    }
  })
  mongoose.connection.on('error', (err) => {
    logApp('error', '[db] Mongoose connection error', { message: err.message })
    dbStatus = { ...dbStatus, state: 'failed', error: err.message }
  })
  mongoose.connection.on('reconnected', () => {
    logDb('log', 'Mongoose event: reconnected')
    dbStatus = { ...dbStatus, state: 'connected', error: null }
  })
}

export function getDbStatus() {
  return { ...dbStatus, connected: isDbConnected() }
}

async function tryConnect(uri) {
  const safeUri = uri.includes('@') ? uri.replace(/:([^:@/]+)@/, ':***@') : uri
  logDb('log', `Connecting mongoose to ${safeUri}…`)

  const isAtlas = uri.startsWith('mongodb+srv://')
  const options = {
    ...MONGO_CONNECT_OPTIONS,
    serverSelectionTimeoutMS: isAtlas ? 15000 : MONGO_CONNECT_OPTIONS.serverSelectionTimeoutMS,
  }

  if (isAtlas) {
    logDb('log', 'Atlas connection — serverSelectionTimeoutMS=15000')
  }

  try {
    await mongoose.connect(uri, options)
    await mongoose.connection.db.admin().ping()
    logDb('log', `MongoDB connected: ${mongoose.connection.host} (readyState=${mongoose.connection.readyState})`)
    dbStatus = { state: 'connected', error: null, uri }
    return mongoose.connection
  } catch (err) {
    logApp('error', '[db] mongoose.connect failed', { message: err.message, stack: err.stack })
    throw err
  }
}

/** Live ping — used by /api/health and requireDb. */
export async function pingDatabase(timeoutMs = 3000) {
  if (mongoose.connection.readyState !== 1) return false

  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB ping timed out')), timeoutMs)
      ),
    ])
    return true
  } catch (err) {
    dbStatus = { ...dbStatus, state: 'failed', error: err.message }
    return false
  }
}

export async function connectDB(uri) {
  mongoose.set('strictQuery', true)
  attachMongooseLifecycleLogs()

  if (!uri) {
    const message = 'MONGODB_URI is not defined. Copy server/.env.example to server/.env.'
    dbStatus = { state: 'failed', error: message, uri: null }
    logApp('error', '[db] MONGODB_URI missing', { message })
    throw new Error(message)
  }

  if (mongoose.connection.readyState === 1 && dbStatus.state === 'connected') {
    logDb('log', 'Already connected — reusing existing mongoose connection')
    return mongoose.connection
  }

  dbStatus = { state: 'connecting', error: null, uri }

  const mode = shouldUseMemoryDb(uri) ? 'memory/dev' : uri.startsWith('mongodb+srv://') ? 'atlas' : 'local'
  logDb('log', `connectDB mode=${mode} rawMONGODB_URI=${uri === 'memory' ? 'memory' : '(set)'}`)

  try {
    let connectionUri = uri

    if (shouldUseMemoryDb(uri)) {
      connectionUri = await startMemoryServer()
      logDb('log', `Dev MongoDB URI resolved: ${connectionUri}`)
    }

    return await tryConnect(connectionUri)
  } catch (err) {
    dbStatus = { state: 'failed', error: err.message, uri }
    logApp('error', '[db] connectDB failed', { message: err.message })

    if (shouldUseMemoryDb(uri)) {
      logDb('log', 'Retrying with alternate dev MongoDB strategy…')
      try {
        if (memoryServer) {
          await memoryServer.stop().catch(() => {})
          memoryServer = null
        }
        const fallbackUri = await spawnDevMongod()
        return await tryConnect(fallbackUri)
      } catch (fallbackErr) {
        logApp('error', '[db] Alternate dev strategy failed', { message: fallbackErr.message })
        dbStatus = { state: 'failed', error: fallbackErr.message, uri }
      }
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

  if (spawnedMongod && !spawnedMongod.killed) {
    spawnedMongod.kill()
    spawnedMongod = null
  }

  dbStatus = { state: 'disconnected', error: null, uri: null }
  logDb('log', 'Disconnected')
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1 && dbStatus.state === 'connected'
}
