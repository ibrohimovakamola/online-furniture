/**
 * Merge NODE_OPTIONS from server/.env before spawning child processes.
 * Tip: --max-old-space-size=4096 needs ~4 GB RAM free on the machine.
 */
export function mergeNodeOptions(existing, ...flags) {
  const parts = new Set(
    String(existing || '')
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
  )
  for (const flag of flags) {
    if (!flag) continue
    const key = flag.split('=')[0]
    for (const part of [...parts]) {
      if (part.startsWith(`${key}=`) || part === key) parts.delete(part)
    }
    parts.add(flag)
  }
  return [...parts].join(' ')
}

/** Apply NODE_OPTIONS from process.env after dotenv load. Idempotent. */
export function applyNodeOptionsFromEnv(defaults = ['--max-old-space-size=4096']) {
  const fromEnv = process.env.NODE_OPTIONS?.trim()
  const merged = mergeNodeOptions(fromEnv, ...defaults)
  if (merged) process.env.NODE_OPTIONS = merged
  return process.env.NODE_OPTIONS
}

/** Human-readable memory snapshot for logs. */
export function getMemorySnapshot() {
  const mu = process.memoryUsage()
  const mb = (n) => `${Math.round(n / 1024 / 1024)} MB`
  return {
    rss: mb(mu.rss),
    heapUsed: mb(mu.heapUsed),
    heapTotal: mb(mu.heapTotal),
    external: mb(mu.external),
    arrayBuffers: mb(mu.arrayBuffers ?? 0),
  }
}
