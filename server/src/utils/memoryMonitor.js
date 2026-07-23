import { getMemorySnapshot } from './applyNodeOptions.js'
import { logApp } from './appLogger.js'

let intervalId = null
const WARN_RSS_MB = Number(process.env.MEMORY_WARN_RSS_MB) || 3072

/**
 * Periodic RSS/heap logging in development.
 * Set MEMORY_MONITOR=false in server/.env to disable.
 */
export function startMemoryMonitor() {
  if (process.env.NODE_ENV === 'test') return
  if (process.env.MEMORY_MONITOR === 'false') return
  if (intervalId) return

  const intervalMs = Number(process.env.MEMORY_MONITOR_INTERVAL_MS) || 60_000

  const tick = () => {
    const snap = getMemorySnapshot()
    const rssMb = Number.parseInt(snap.rss, 10)
    const level = Number.isFinite(rssMb) && rssMb >= WARN_RSS_MB ? 'warn' : 'debug'
    logApp(level, '[memory] process usage', snap)
  }

  tick()
  intervalId = setInterval(tick, intervalMs)
  intervalId.unref?.()
}

export function stopMemoryMonitor() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
