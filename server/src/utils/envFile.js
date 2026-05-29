import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env')

/** One-time flag: after forced password reset, flip back to false in .env */
export function clearPasswordResetFlag() {
  if (process.env.SEED_RESET_ADMIN_PASSWORD !== 'true') return false

  try {
    const content = fs.readFileSync(envPath, 'utf8')
    if (!content.includes('SEED_RESET_ADMIN_PASSWORD=true')) return false

    const updated = content.replace(
      /SEED_RESET_ADMIN_PASSWORD\s*=\s*true/i,
      'SEED_RESET_ADMIN_PASSWORD=false'
    )
    fs.writeFileSync(envPath, updated, 'utf8')
    process.env.SEED_RESET_ADMIN_PASSWORD = 'false'
    console.log('[env] SEED_RESET_ADMIN_PASSWORD auto-set back to false in server/.env')
    return true
  } catch (err) {
    console.warn('[env] Could not update .env file:', err.message)
    return false
  }
}
