import { logAdminActivity } from './activityLogger.js'

/**
 * Admin audit logging — console + ActivityLog persistence.
 */
export function logAdminAction(req, action, details = {}) {
  const admin = req.user
    ? { id: String(req.user._id), email: req.user.email, role: req.user.role }
    : { id: 'unknown' }

  console.log(
    '[admin-audit]',
    JSON.stringify({
      action,
      admin,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      ...details,
      at: new Date().toISOString(),
    })
  )

  logAdminActivity(req, action, details)
}
