import crypto from 'crypto'
import ErrorLog from '../models/ErrorLog.js'
import { getRequestMeta } from './activityLogger.js'
import { logAppError } from './winstonLogger.js'

function buildFingerprint(err, req, statusCode) {
  const key = [
    statusCode,
    req?.method || '',
    req?.originalUrl || req?.path || '',
    err?.name || 'Error',
    err?.message || 'unknown',
  ].join('|')
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 32)
}

/**
 * Winston + MongoDB error tracking with frequency upsert.
 */
export function trackError(err, req, { errorId, statusCode = 500, code = null } = {}) {
  const meta = getRequestMeta(req)
  const message = err?.message || String(err)
  const stack = err?.stack || ''
  const fingerprint = buildFingerprint(err, req, statusCode)

  logAppError({
    errorId,
    statusCode,
    message,
    stack,
    method: req?.method,
    path: req?.originalUrl || req?.path,
    userId: req?.user?._id,
    ipAddress: meta.ipAddress,
    code: code || err?.code,
    isOperational: err?.isOperational !== false,
  })

  ErrorLog.findOneAndUpdate(
    { fingerprint },
    {
      $set: {
        message: message.slice(0, 500),
        stack: stack.slice(0, 4000),
        statusCode,
        path: String(req?.originalUrl || req?.path || '').slice(0, 500),
        method: req?.method || '',
        userId: req?.user?._id || null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        lastSeenAt: new Date(),
      },
      $inc: { count: 1 },
      $setOnInsert: { fingerprint },
    },
    { upsert: true }
  ).catch((saveErr) => {
    logAppError({
      errorId: errorId || 'ERR-TRACKER',
      statusCode: 500,
      message: `ErrorLog persist failed: ${saveErr.message}`,
    })
  })
}

/** @deprecated use trackError */
export const logError = trackError
