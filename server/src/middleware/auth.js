import User from '../models/User.js'
import { verifyToken } from '../utils/token.js'
import { AppError } from '../utils/asyncHandler.js'
import { ADMIN_ROLES, roleHasPermission } from '../config/roles.js'

export async function protect(req, _res, next) {
  try {
    const header =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.get?.('authorization')

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401)
    }

    const token = header.slice(7).trim()
    if (!token) {
      throw new AppError('Authentication required', 401)
    }

    const decoded = verifyToken(token)

    const user = await User.findById(decoded.id)

    if (!user || !user.isActive) {
      throw new AppError('Account not found or deactivated', 401)
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401))
    }
    next(err)
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403))
    }

    next()
  }
}

export function authorizePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roleHasPermission(req.user.role, permission)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}

/** Allow route when user has at least one of the given permissions */
export function authorizeAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    const allowed = permissions.some((p) => roleHasPermission(req.user.role, p))
    if (!allowed) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}

/** Blocks customers from any /api/admin/* route */
export function requireAdminPanelAccess(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401))
  }

  if (!ADMIN_ROLES.includes(req.user.role)) {
    return next(new AppError('Admin panel access denied', 403))
  }

  next()
}

/** Alias for requireAdminPanelAccess */
export const adminAuth = requireAdminPanelAccess
export const requireAdmin = requireAdminPanelAccess
