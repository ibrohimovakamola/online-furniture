import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { logApp } from './appLogger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '../..')
const envPath = path.join(serverRoot, '.env')
const examplePath = path.join(serverRoot, '.env.example')
const productionExamplePath = path.join(serverRoot, '.env.production.example')

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production')

if (isProduction && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

/** Load env file before any other module reads process.env */
function loadEnvFile() {
  if (isProduction) {
    if (!fs.existsSync(envPath)) {
      logApp(
        'error',
        '[env] NODE_ENV=production but server/.env is missing.\n' +
          '      Copy server/.env.production.example → server/.env'
      )
      process.exit(1)
    }
    const result = dotenv.config({ path: envPath })
    if (result.error) {
      logApp('error', '[env] Failed to load server/.env', { message: result.error.message })
      process.exit(1)
    }
    logApp('info', '[env] Loaded server/.env (production)')
    return
  }

  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
    logApp('info', '[env] Created server/.env from .env.example')
  }

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    logApp('info', '[env] Loaded server/.env')
  } else if (fs.existsSync(productionExamplePath)) {
    logApp('warn', '[env] No server/.env — copy .env.example or .env.production.example')
  }
}

loadEnvFile()
