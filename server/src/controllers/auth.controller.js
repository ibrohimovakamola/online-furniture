import crypto from 'crypto'
import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { sendPasswordResetEmail, sendWelcomeEmail } from './emailController.js'
import {
  issueAuthSession,
  rotateAuthSession,
  verifyRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  clearAuthCookies,
  blacklistAccessToken,
  REFRESH_COOKIE_NAME,
} from '../utils/jwt.js'
import { AppError, Errors } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseDisplayName, sendAuthSuccess, sendUserSuccess } from '../utils/authResponse.js'
import { logUserSignup, logUserLogin } from '../utils/activityLogger.js'
import { extractBearerToken } from '../middleware/auth.js'
import { logApp } from '../utils/appLogger.js'

function resolveSignupNames(body) {
  if (body.firstName) {
    return {
      firstName: body.firstName.trim(),
      lastName: (body.lastName || body.firstName).trim(),
    }
  }
  return parseDisplayName(body.name)
}

/** POST /api/auth/signup | /register — customer registration */
export const signup = asyncHandler(async (req, res) => {
  const { email, password, phone } = req.body
  const { firstName, lastName } = resolveSignupNames(req.body)
  const normalizedEmail = email.toLowerCase().trim()

  const exists = await User.findOne({ email: normalizedEmail })
  if (exists) {
    throw Errors.emailRegistered()
  }

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    phone: phone || '',
    role: ROLES.CUSTOMER,
  })

  const token = await issueAuthSession(user, res)

  sendWelcomeEmail(user)

  logUserSignup(user, req)

  sendAuthSuccess(res, {
    user,
    token,
    message: 'Signup successful',
    status: 201,
  })
})

/** @deprecated alias — use signup */
export const registerCustomer = signup

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = req.body?.password

  try {
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!user.password) {
      logApp('error', '[login] User found but password hash is missing', { email })
      throw new AppError('Invalid email or password', 401)
    }

    const passwordValid = await user.comparePassword(password)
    if (!passwordValid) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 403)
    }

    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    const token = await issueAuthSession(user, res)

    logUserLogin(user, req)

    sendAuthSuccess(res, {
      user,
      token,
      message: 'Login successful',
    })
  } catch (error) {
    if (error instanceof AppError) throw error

    logApp('error', '[login] Error', { message: error.message, stack: error.stack })

    if (error.name === 'JsonWebTokenError' || error.message?.includes('JWT_SECRET')) {
      throw new AppError('Server auth configuration error. Contact support.', 500)
    }

    throw new AppError(error.message || 'Login failed. Please try again.', 500)
  }
})

/** POST /api/auth/refresh — rotate refresh cookie, return new access token */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401)
  }

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    clearRefreshCookie(res)
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await findValidRefreshToken(decoded.id, refreshToken)
  if (!user) {
    clearRefreshCookie(res)
    throw new AppError('Refresh token revoked or not found', 401)
  }

  if (!user.isActive) {
    clearRefreshCookie(res)
    throw new AppError('Account has been deactivated', 403)
  }

  const token = await rotateAuthSession(user, res, refreshToken)

  res.json({
    success: true,
    token,
  })
})

/** POST /api/auth/logout — revoke refresh token and clear cookie */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]

  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken)
      await revokeRefreshToken(decoded.id, refreshToken)
    } catch {
      /* ignore invalid refresh token on logout */
    }
  }

  await blacklistAccessToken(req.authToken || extractBearerToken(req))
  clearAuthCookies(res)
  res.json({ success: true, message: 'Logged out successfully' })
})

/** GET /api/auth/me — current authenticated user */
export const getCurrentUser = asyncHandler(async (req, res) => {
  sendUserSuccess(res, {
    user: req.user,
    message: 'Profile loaded',
  })
})

/** @deprecated alias */
export const getMe = getCurrentUser

/** PUT /api/auth/profile — update own profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const { name, firstName, lastName, phone, address } = req.body

  if (name) {
    const parsed = parseDisplayName(name)
    user.firstName = parsed.firstName
    user.lastName = parsed.lastName
  }
  if (firstName) user.firstName = firstName.trim()
  if (lastName) user.lastName = lastName.trim()
  if (phone !== undefined) user.phone = phone
  if (address !== undefined) user.address = address

  await user.save()

  sendUserSuccess(res, {
    user,
    message: 'Profile updated successfully',
  })
})

/** DELETE /api/auth/account — permanently delete own account */
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password')
  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (req.body?.password) {
    const valid = await user.comparePassword(req.body.password)
    if (!valid) {
      throw new AppError('Invalid password', 401)
    }
  }

  if ([ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(user.role)) {
    throw new AppError('Staff accounts cannot be deleted via this endpoint', 403)
  }

  await user.deleteOne()
  clearRefreshCookie(res)

  res.json({
    success: true,
    message: 'Account deleted successfully',
  })
})

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function buildResetLink(rawToken) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`
}

/** POST /api/auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires')
  if (user?.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = hashResetToken(rawToken)
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save({ validateBeforeSave: false })
    sendPasswordResetEmail(user.email, buildResetLink(rawToken))
  }

  res.json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  })
})

/** POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || '').trim()
  const newPassword = req.body?.newPassword
  const confirmPassword = req.body?.confirmPassword

  if (!token || !newPassword || !confirmPassword) {
    throw new AppError('Token and new password are required', 400)
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400)
  }

  const hashed = hashResetToken(token)
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires')

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400)
  }

  user.password = newPassword
  user.passwordResetToken = null
  user.passwordResetExpires = null
  await user.save()

  res.json({ success: true, message: 'Password reset successfully. You can log in now.' })
})

/** POST /api/auth/change-password — authenticated user */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('All password fields are required', 400)
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('New passwords do not match', 400)
  }

  const user = await User.findById(req.user._id).select('+password')
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const valid = await user.comparePassword(currentPassword)
  if (!valid) {
    throw new AppError('Current password is incorrect', 401)
  }

  user.password = newPassword
  await user.save()

  res.json({ success: true, message: 'Password updated successfully' })
})

/** POST /api/auth/admin/users — Super Admin creates Manager or another Super Admin */
export const createStaffUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body

  if (![ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(role)) {
    throw new AppError('Only manager or super_admin roles can be created here', 400)
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) {
    throw new AppError('Email already registered', 409)
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    createdBy: req.user._id,
  })

  res.status(201).json({
    success: true,
    user: user.toSafeObject(),
  })
})

/** GET /api/auth/admin/users — Super Admin lists staff accounts */
export const listStaffUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({
    role: { $in: [ROLES.SUPER_ADMIN, ROLES.MANAGER] },
  }).sort({ createdAt: -1 })

  res.json({
    success: true,
    users: users.map((u) => u.toSafeObject()),
  })
})

/** DELETE /api/auth/admin/users/:id — Super Admin removes staff account */
export const deleteStaffUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id)

  if (!target) {
    throw new AppError('User not found', 404)
  }

  if (target._id.equals(req.user._id)) {
    throw new AppError('You cannot delete your own account', 400)
  }

  if (target.role === ROLES.CUSTOMER) {
    throw new AppError('Use the customers endpoint for customer accounts', 400)
  }

  await target.deleteOne()

  res.json({ success: true, message: 'User deleted' })
})
