import crypto from 'crypto'
import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
} from './emailController.js'
import {
  issueAuthSession,
  rotateAuthSession,
  verifyRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  clearAuthCookies,
  clearRefreshCookie,
  blacklistAccessToken,
  REFRESH_COOKIE_NAME,
} from '../utils/jwt.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseDisplayName, sendAuthSuccess, sendUserSuccess } from '../utils/authResponse.js'
import { logUserSignup, logUserLogin } from '../utils/activityLogger.js'
import { extractBearerToken } from '../middleware/auth.js'
import { logApp } from '../utils/appLogger.js'
import {
  normalizeUzPhone,
  isValidUzPhone,
  requireEmailVerification,
  hashAuthToken,
  generateRawAuthToken,
  formatAddressField,
} from '../utils/authHelpers.js'

function resolveSignupNames(body) {
  if (body.firstName) {
    return {
      firstName: body.firstName.trim(),
      lastName: (body.lastName || body.firstName).trim(),
    }
  }
  return parseDisplayName(body.name)
}

function buildResetLink(rawToken) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`
}

function buildVerifyLink(rawToken) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${base}/verify-email?token=${encodeURIComponent(rawToken)}`
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** POST /api/auth/signup | /register — customer registration */
export const signup = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    confirmPassword,
    phone,
    phoneNumber,
    preferredLanguage,
    preferences,
  } = req.body
  const { firstName, lastName } = resolveSignupNames(req.body)
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPhone = normalizeUzPhone(phoneNumber || phone)

  if (!isValidUzPhone(normalizedPhone)) {
    throw new AppError('Phone must be in +998XXXXXXXXX format', 400)
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400)
  }

  const emailExists = await User.findOne({ email: normalizedEmail })
  if (emailExists) {
    throw new AppError('Email already registered', 409)
  }

  const phoneExists = await User.findOne({ phone: normalizedPhone })
  if (phoneExists) {
    throw new AppError('Phone number already registered', 409)
  }

  const needsVerification = requireEmailVerification()
  const rawVerifyToken = needsVerification ? generateRawAuthToken() : null

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    phone: normalizedPhone,
    role: ROLES.CUSTOMER,
    preferredLanguage: preferredLanguage || 'uz',
    preferences: {
      newsletter: Boolean(preferences?.newsletter),
      notifications: preferences?.notifications !== false,
    },
    isEmailVerified: !needsVerification,
    ...(needsVerification
      ? {
          emailVerificationToken: hashAuthToken(rawVerifyToken),
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      : {}),
  })

  logUserSignup(user, req)

  if (needsVerification) {
    sendEmailVerificationEmail(user, buildVerifyLink(rawVerifyToken), {
      lang: user.preferredLanguage,
    })

    return res.status(201).json({
      success: true,
      message: 'Check your email to verify your account',
      userId: user._id,
      requiresVerification: true,
    })
  }

  const token = await issueAuthSession(user, res, { rememberMe: true })
  sendWelcomeEmail(user, { lang: user.preferredLanguage })

  sendAuthSuccess(res, {
    user,
    token,
    message: 'Signup successful',
    status: 201,
  })
})

/** @deprecated alias — use signup */
export const registerCustomer = signup

/** POST /api/auth/verify-email */
export const verifyEmail = asyncHandler(async (req, res) => {
  const token = String(req.body?.verificationToken || req.body?.token || '').trim()
  if (!token) {
    throw new AppError('Verification token is required', 400)
  }

  const hashed = hashAuthToken(token)
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiry: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpiry')

  if (!user) {
    throw new AppError('Verification link expired or invalid', 400)
  }

  user.isEmailVerified = true
  user.emailVerificationToken = null
  user.emailVerificationExpiry = null
  await user.save({ validateBeforeSave: false })

  sendWelcomeEmail(user, { lang: user.preferredLanguage })

  res.json({
    success: true,
    message: 'Email verified successfully',
    redirectUrl: '/login',
  })
})

/** POST /api/auth/resend-verification */
export const resendVerification = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await User.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationExpiry'
  )

  if (user?.isActive && !user.isEmailVerified) {
    const rawToken = generateRawAuthToken()
    user.emailVerificationToken = hashAuthToken(rawToken)
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await user.save({ validateBeforeSave: false })
    sendEmailVerificationEmail(user, buildVerifyLink(rawToken), {
      lang: user.preferredLanguage,
    })
  }

  res.json({
    success: true,
    message: 'If that email is registered and unverified, a verification link has been sent.',
  })
})

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = req.body?.password
  const rememberMe = Boolean(req.body?.rememberMe)

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

    if (
      requireEmailVerification() &&
      !user.isEmailVerified &&
      user.role === ROLES.CUSTOMER
    ) {
      throw new AppError('Please verify your email before logging in', 403)
    }

    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })

    const token = await issueAuthSession(user, res, { rememberMe })

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

  const {
    name,
    firstName,
    lastName,
    phone,
    phoneNumber,
    address,
    preferredLanguage,
    preferences,
    profileImage,
  } = req.body

  if (name) {
    const parsed = parseDisplayName(name)
    user.firstName = parsed.firstName
    user.lastName = parsed.lastName
  }
  if (firstName) user.firstName = firstName.trim()
  if (lastName) user.lastName = lastName.trim()

  const nextPhone = phoneNumber ?? phone
  if (nextPhone !== undefined) {
    const normalized = normalizeUzPhone(nextPhone)
    if (normalized && !isValidUzPhone(normalized)) {
      throw new AppError('Phone must be in +998XXXXXXXXX format', 400)
    }
    if (normalized) {
      const phoneTaken = await User.findOne({
        phone: normalized,
        _id: { $ne: user._id },
      })
      if (phoneTaken) {
        throw new AppError('Phone number already registered', 409)
      }
      user.phone = normalized
    }
  }

  if (address !== undefined) {
    if (typeof address === 'string') {
      user.address = { ...formatAddressField(user.address), street: address.trim() }
    } else {
      user.address = {
        ...formatAddressField(user.address),
        ...address,
      }
    }
  }

  if (preferredLanguage && ['uz', 'ru', 'en'].includes(preferredLanguage)) {
    user.preferredLanguage = preferredLanguage
  }

  if (preferences) {
    user.preferences = {
      newsletter: preferences.newsletter ?? user.preferences?.newsletter ?? false,
      notifications: preferences.notifications ?? user.preferences?.notifications ?? true,
    }
  }

  if (profileImage !== undefined) {
    user.profileImage = String(profileImage || '').trim()
  }

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
    sendPasswordResetEmail(user.email, buildResetLink(rawToken), {
      lang: user.preferredLanguage,
    })
  }

  res.json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  })
})

/** POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || req.body?.resetToken || '').trim()
  const newPassword = req.body?.newPassword || req.body?.password
  const confirmPassword = req.body?.confirmPassword ?? newPassword

  if (!token || !newPassword) {
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

  res.json({
    success: true,
    message: 'Password reset successfully. You can log in now.',
    redirectUrl: '/login',
  })
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
    isEmailVerified: true,
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
