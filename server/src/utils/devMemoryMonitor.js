/**
 * Development-only memory monitor.
 *
 * Tips to reduce ERR_INSUFFICIENT_RESOURCES:
 * - NODE_OPTIONS=--max-old-space-size=4096 (set in npm run dev)
 * - SWAGGER_ENABLED=false saves ~50–80 MB at startup
 * - SEED_ADMIN_DATA=false skips heavy demo seed on every empty DB
 * - Use Atlas or local mongod instead of memory-server if disk/RAM is tight
 * - Run `npm run dev:client` + `npm run dev:server` in separate terminals
 */
import { logApp } from './appLogger.js'

const INTERVAL_MS = Number(process.env.DEV_MEMORY_LOG_MS) || 60_000
const WARN_HEAP_MB = Number(process.env.DEV_MEMORY_WARN_MB) || 3072
const CRITICAL_HEAP_MB = Number(process.env.DEV_MEMORY_CRITICAL_MB) || 3584

let timer = null

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function logMemorySnapshot(label = 'snapshot') {
  const mem = process.memoryUsage()
  const payload = {
    label,
    heapUsed: formatMb(mem.heapUsed),
    heapTotal: formatMb(mem.heapTotal),
    rss: formatMb(mem.rss),
    external: formatMb(mem.external),
    arrayBuffers: formatMb(mem.arrayBuffers),
  }

  const heapUsedMb = mem.heapUsed / 1024 / 1024
  if (heapUsedMb >= CRITICAL_HEAP_MB) {
    logApp('error', '[memory] CRITICAL heap usage — restart recommended', payload)
  } else if (heapUsedMb >= WARN_HEAP_MB) {
    logApp('warn', '[memory] High heap usage', payload)
  } else if (process.env.DEV_MEMORY_VERBOSE === 'true') {
    logApp('info', '[memory] OK', payload)
  }

  return mem
}

export function startMemoryMonitor() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return
  if (process.env.DEV_MEMORY_MONITOR === 'false') return
  if (timer) return

  logMemorySnapshot('startup')
  timer = setInterval(() => logMemorySnapshot('periodic'), INTERVAL_MS)
  timer.unref?.()
}

export function stopMemoryMonitor() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
