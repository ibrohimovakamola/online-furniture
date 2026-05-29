import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { clearPasswordResetFlag } from './envFile.js'

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value)
}

/**
 * Ensures the configured Super Admin exists with a valid bcrypt password.
 * Controlled via SEED_SUPER_ADMIN env flag.
 */
export async function seedSuperAdmin() {
  if (process.env.SEED_SUPER_ADMIN !== 'true') return

  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim()
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!email || !password) {
    console.warn('SEED_SUPER_ADMIN is true but SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is missing')
    return
  }

  let user = await User.findOne({ email }).select('+password')

  if (!user) {
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password,
      role: ROLES.SUPER_ADMIN,
    })
    console.log(`Super Admin seeded: ${email}`)
    if (process.env.SEED_RESET_ADMIN_PASSWORD === 'true') clearPasswordResetFlag()
    return
  }

  const forceReset = process.env.SEED_RESET_ADMIN_PASSWORD === 'true'
  const needsHashFix = !isBcryptHash(user.password)

  if (forceReset || needsHashFix) {
    user.password = password
    await user.save()
    console.log(
      forceReset
        ? `Super Admin password reset (SEED_RESET_ADMIN_PASSWORD): ${email}`
        : `Super Admin password re-hashed (invalid hash fixed): ${email}`
    )
    if (forceReset) clearPasswordResetFlag()
    return
  }

  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    user.password = password
    await user.save()
    console.log(`Super Admin password synced to .env value: ${email}`)
    return
  }

  console.log(`Super Admin already exists: ${email}`)
}
