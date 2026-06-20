import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import { AppError } from './AppError.js'

export const REFRESH_COOKIE_NAME = 'refreshToken'
export const ACCESS_COOKIE_NAME = 'accessToken'
const MAX_REFRESH_SESSIONS = 10

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length < 8) {
    throw new AppError('JWT_SECRET is missing or too short', 500)
  }
  return secret
}

function getRefreshSecret() {
  const secret = process.env.REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret || secret.trim().length < 32) {
    throw new AppError('REFRESH_SECRET is missing or too short (min 32 chars)', 500)
  }
  return secret
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getRefreshExpiryDate(refreshToken) {
  const decoded = jwt.decode(refreshToken)
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000)
  }
  const days = parseInt(String(process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'), 10) || 30
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function getAccessCookieMaxAge() {
  const raw = process.env.JWT_EXPIRES_IN || '7d'
  const match = String(raw).match(/^(\d+)([dhms])?$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const n = Number(match[1])
  const unit = match[2] || 'd'
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return n * (multipliers[unit] || multipliers.d)
}

export function generateTokens(user) {
  const userId = user._id?.toString() || String(user.id)
  const role = user.role
  const jti = crypto.randomUUID()

  const accessToken = jwt.sign({ id: userId, role, jti }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, getRefreshSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  })

  return { accessToken, refreshToken, jti }
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, getRefreshSecret())
  if (decoded.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid refresh token type')
  }
  return decoded
}

export async function isTokenBlacklisted(jti) {
  if (!jti) return false
  const hit = await TokenBlacklist.findOne({ jti }).select('_id').lean()
  return Boolean(hit)
}

export async function blacklistAccessToken(token) {
  if (!token) return
  try {
    const decoded = jwt.decode(token)
    if (!decoded?.jti || !decoded?.exp) return
    await TokenBlacklist.findOneAndUpdate(
      { jti: decoded.jti },
      { jti: decoded.jti, expiresAt: new Date(decoded.exp * 1000) },
      { upsert: true }
    )
  } catch {
    /* ignore invalid token on logout */
  }
}

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
  }
}

export function getRefreshCookieOptions() {
  return {
    ...cookieBaseOptions(),
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}

export function getAccessCookieOptions() {
  return {
    ...cookieBaseOptions(),
    path: '/api',
    maxAge: getAccessCookieMaxAge(),
  }
}

export function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions())
}

export function setAccessCookie(res, accessToken) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions())
}

export function clearAuthCookies(res) {
  const base = cookieBaseOptions()
  res.clearCookie(REFRESH_COOKIE_NAME, { ...base, path: '/api/auth' })
  res.clearCookie(ACCESS_COOKIE_NAME, { ...base, path: '/api' })
}

export function clearRefreshCookie(res) {
  clearAuthCookies(res)
}

async function pruneExpiredRefreshTokens(userId) {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } }
  )
}

export async function persistRefreshToken(userId, refreshToken) {
  await pruneExpiredRefreshTokens(userId)

  const tokenHash = hashToken(refreshToken)
  const expiresAt = getRefreshExpiryDate(refreshToken)

  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        $each: [{ token: tokenHash, expiresAt, createdAt: new Date() }],
        $slice: -MAX_REFRESH_SESSIONS,
      },
    },
  })
}

export async function revokeRefreshToken(userId, refreshToken) {
  const tokenHash = hashToken(refreshToken)
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token: tokenHash } },
  })
}

export async function findValidRefreshToken(userId, refreshToken) {
  const tokenHash = hashToken(refreshToken)
  const user = await User.findById(userId).select('+refreshTokens')
  if (!user) return null

  const entry = user.refreshTokens?.find(
    (rt) => rt.token === tokenHash && rt.expiresAt > new Date()
  )
  return entry ? user : null
}

/** Login/register: issue tokens, persist refresh, set httpOnly cookies. Returns access token. */
export async function issueAuthSession(user, res) {
  const { accessToken, refreshToken } = generateTokens(user)
  await persistRefreshToken(user._id, refreshToken)
  setRefreshCookie(res, refreshToken)
  setAccessCookie(res, accessToken)
  return accessToken
}

/** Refresh rotation: revoke old refresh, issue new pair. */
export async function rotateAuthSession(user, res, oldRefreshToken) {
  await revokeRefreshToken(user._id, oldRefreshToken)
  return issueAuthSession(user, res)
}
