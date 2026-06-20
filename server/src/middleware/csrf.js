import crypto from 'crypto'

const CSRF_COOKIE = 'csrfToken'
const CSRF_HEADER = 'x-csrf-token'

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,
  }
}

/** GET /api/csrf-token — issue double-submit CSRF token for form/file uploads */
export function issueCsrfToken(_req, res) {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie(CSRF_COOKIE, token, cookieOptions())
  res.json({ success: true, data: { csrfToken: token } })
}

/** Verify CSRF header matches cookie (skip when CSRF_ENABLED=false) */
export function verifyCsrf(req, res, next) {
  if (process.env.CSRF_ENABLED === 'false') return next()
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER]

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    })
  }

  next()
}

export default { issueCsrfToken, verifyCsrf }
