import multer from 'multer'
import { AppError } from '../utils/asyncHandler.js'

/**
 * Wraps multer middleware so upload errors reach Express error handler.
 * Do not place 4-arg error middleware between upload and controller.
 */
export function withMulter(uploadMiddleware) {
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
