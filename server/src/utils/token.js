/**
 * Backward-compatible JWT helpers — delegates to jwt.js
 */
export {
  generateTokens,
  verifyAccessToken as verifyToken,
  issueAuthSession,
  rotateAuthSession,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} from './jwt.js'

import { generateTokens } from './jwt.js'

/** @deprecated Use issueAuthSession for login flows */
export function signToken(payload) {
  return generateTokens({ _id: payload.id, id: payload.id, role: payload.role }).accessToken
}

export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
