import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { signToken } from '../utils/token.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'

/** POST /api/auth/register — Customer self-registration only */
export const registerCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  if (!firstName || !lastName || !email || !password) {
    throw new AppError('All fields are required', 400)
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
    role: ROLES.CUSTOMER,
  })

  const token = signToken({ id: user._id, role: user.role })

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  })
})

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim()
    const password = req.body?.password

    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!user.password) {
      console.error('[login] User found but password hash is missing:', email)
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

    const token = signToken({ id: user._id, role: user.role })

    res.json({
      success: true,
      token,
      user: user.toSafeObject(),
    })
  } catch (error) {
    if (error instanceof AppError) throw error

    console.error('[login] Unhandled error:', error)
    throw new AppError('Login failed. Please try again.', 500)
  }
})

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject(),
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
