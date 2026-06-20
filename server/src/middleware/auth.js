import User from '../models/User.js'
import {
  verifyAccessToken,
  isTokenBlacklisted,
  ACCESS_COOKIE_NAME,
} from '../utils/jwt.js'
import { verifyToken as verifyLegacyToken } from '../utils/token.js'
import {
  AuthenticationError,
  AuthorizationError,
} from '../utils/AppError.js'
import { ADMIN_ROLES, roleHasPermission } from '../config/roles.js'

/**
 * Extract Bearer token from Authorization header or httpOnly access cookie.
 */
export function extractBearerToken(req) {
  const header =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.get?.('authorization')

  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7).trim()
    if (token) return token
  }

  return req.cookies?.[ACCESS_COOKIE_NAME] || null
}

/**
 * Verify JWT string and return decoded payload.
 */
export async function verifyToken(token) {
  if (!token) {
    throw new AuthenticationError()
  }

  try {
    const decoded = verifyAccessToken(token)
    if (decoded?.jti && (await isTokenBlacklisted(decoded.jti))) {
      throw new AuthenticationError()
    }
    return decoded
  } catch (err) {
    if (err instanceof AuthenticationError) throw err
    throw new AuthenticationError()
  }
}

/** Protected route middleware — validates JWT and loads req.user */
export async function authenticateUser(req, _res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      throw new AuthenticationError()
    }

    const decoded = await verifyToken(token)
    const user = await User.findById(decoded.id)

    if (!user || !user.isActive) {
      throw new AuthenticationError()
    }

    req.user = user
    req.authToken = token
    next()
  } catch (err) {
    next(err instanceof AuthenticationError ? err : new AuthenticationError())
  }
}

export const protect = authenticateUser

export function authorizeRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError())
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('You do not have permission to access this resource'))
    }

    next()
  }
}

export const authorize = authorizeRole

export function authorizePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError())
    }

    if (!roleHasPermission(req.user.role, permission)) {
      return next(new AuthorizationError('Insufficient permissions'))
    }

    next()
  }
}

export function authorizeAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError())
    }

    const allowed = permissions.some((p) => roleHasPermission(req.user.role, p))
    if (!allowed) {
      return next(new AuthorizationError('Insufficient permissions'))
    }

    next()
  }
}

export function requireAdminPanelAccess(req, _res, next) {
  if (!req.user) {
    return next(new AuthenticationError())
  }

  if (!ADMIN_ROLES.includes(req.user.role)) {
    return next(new AuthorizationError('Admin panel access denied'))
  }

  next()
}

export const adminAuth = requireAdminPanelAccess
export const requireAdmin = requireAdminPanelAccess

export { verifyLegacyToken }
