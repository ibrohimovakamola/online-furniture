import { logAppError } from './winstonLogger.js'

/**
 * Logs structured controller errors via Winston (no raw console in production).
 */
export function logControllerError(label, err, extra = {}) {
  const details = {
    label,
    message: err?.message || String(err),
    ...extra,
  }

  if (err?.name === 'ValidationError' && err.errors) {
    details.validation = Object.fromEntries(
      Object.entries(err.errors).map(([field, detail]) => [field, detail.message])
    )
  }
  if (err?.code === 11000) {
    details.duplicateKey = err.keyPattern || err.keyValue
  }

  logAppError({
    errorId: `CTRL-${label}`,
    statusCode: err?.statusCode || 500,
    message: details.message,
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
    code: err?.code,
    isOperational: err?.isOperational ?? false,
    ...details,
  })
}
