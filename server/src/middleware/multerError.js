import multer from 'multer'
import { AppError } from '../utils/AppError.js'
import { verifyCsrf } from './csrf.js'

function runMulter(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next()

      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5MB' : err.message
        return next(new AppError(message, 400))
      }

      return next(new AppError(err.message || 'Upload failed', 400))
    })
  }
}

/**
 * Wraps multer middleware with optional CSRF verification for file uploads.
 */
export function withMulter(uploadMiddleware, { csrf = true } = {}) {
  const uploadHandler = runMulter(uploadMiddleware)
  if (!csrf) return uploadHandler

  return (req, res, next) => {
    verifyCsrf(req, res, (csrfErr) => {
      if (csrfErr) return next(csrfErr)
      uploadHandler(req, res, next)
    })
  }
}

/** @deprecated Use withMulter() in route chains */
export function handleMulterError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    return next(
      new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5MB' : err.message, 400)
    )
  }
  if (err) {
    return next(new AppError(err.message || 'Upload failed', 400))
  }
  next()
}
