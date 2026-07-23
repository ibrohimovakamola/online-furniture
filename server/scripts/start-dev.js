#!/usr/bin/env node
/**
 * Development server launcher with 4 GB heap and optional memory monitoring.
 *
 * Usage (from server/):
 *   npm run dev
 *
 * From project root:
 *   npm run dev:server
 *
 * Memory tips (see also server/.env):
 * - Keep NODE_OPTIONS=--max-old-space-size=4096
 * - SWAGGER_ENABLED=false on low-RAM machines
 * - MONGODB_URI=mongodb://127.0.0.1:27017/kresla if memory-server is too heavy
 * - Split frontend/backend: npm run dev:client + npm run dev:server
 */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')

const HEAP_MB = process.env.NODE_HEAP_MB || '4096'
const watchPaths = (process.env.DEV_WATCH_PATHS || 'src').split(',').map((p) => p.trim())

const nodeArgs = [`--max-old-space-size=${HEAP_MB}`, ...watchPaths.flatMap((p) => ['--watch-path', p]), 'src/server.js']

const childEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV_MEMORY_MONITOR: process.env.DEV_MEMORY_MONITOR ?? 'true',
  NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, `--max-old-space-size=${HEAP_MB}`),
}

console.log(`[start-dev] Launching API with --max-old-space-size=${HEAP_MB}`)
console.log('[start-dev] Memory monitor:', childEnv.DEV_MEMORY_MONITOR === 'true' ? 'on' : 'off')
console.log('[start-dev] Press Ctrl+C to stop\n')

const child = spawn(process.execPath, nodeArgs, {
  cwd: serverRoot,
  env: childEnv,
  stdio: 'inherit',
  shell: false,
})

function mergeNodeOptions(existing, flag) {
  const parts = (existing || '').split(/\s+/).filter(Boolean)
  const key = flag.split('=')[0]
  const filtered = parts.filter((p) => !p.startsWith(key))
  filtered.push(flag)
  return filtered.join(' ')
}

function forwardSignal(signal) {
  if (!child.killed) child.kill(signal)
}

process.on('SIGINT', () => forwardSignal('SIGINT'))
process.on('SIGTERM', () => forwardSignal('SIGTERM'))

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0)
    return
  }
  process.exit(code ?? 0)
})

child.on('error', (err) => {
  console.error('[start-dev] Failed to start server:', err.message)
  process.exit(1)
})
