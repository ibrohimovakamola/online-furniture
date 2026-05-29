import { AppError } from '../utils/asyncHandler.js'

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500
  let message = err.isOperational ? err.message : 'Internal server error'

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ')
  }

  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid value for field "${err.path}"`
  }

  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    statusCode = 503
    message = 'Database is unavailable. Restart the backend server.'
  }

  console.error('[errorHandler]', err.message || err)
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function notFound(_req, _res, next) {
  next(new AppError('Route not found', 404))
}
