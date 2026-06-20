import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  ServerError,
  Errors,
} from '../utils/AppError.js'
import { generateErrorId } from '../utils/errorId.js'
import { trackError } from '../utils/errorTracker.js'

const GENERIC_AUTH_MESSAGE = 'Invalid credentials'
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later.'

function isMongooseValidationError(err) {
  return err?.name === 'ValidationError' && err.errors && !(err instanceof ValidationError)
}

function normalizeError(err) {
  let statusCode = Number(err.statusCode) || 500
  let message = err.message || GENERIC_SERVER_MESSAGE
  let details = err.details ?? null
  let code = err.code ?? null
  let expose = err.expose !== false && err.isOperational !== false

  if (err instanceof ValidationError) {
    statusCode = 400
    message = err.message
    details = err.details
    code = err.code
  } else if (isMongooseValidationError(err)) {
    statusCode = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ')
    code = 'MONGOOSE_VALIDATION_ERROR'
  } else if (err instanceof AuthenticationError) {
    statusCode = 401
    message = GENERIC_AUTH_MESSAGE
    expose = false
  } else if (err instanceof AuthorizationError) {
    statusCode = 403
    message = err.message
  } else if (err instanceof NotFoundError) {
    statusCode = 404
    message = err.message
  } else if (err instanceof ConflictError) {
    statusCode = 409
    message = err.message
  } else if (err instanceof ServerError) {
    statusCode = 500
    message = GENERIC_SERVER_MESSAGE
    expose = false
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid request data'
    code = 'INVALID_ID'
  } else if (err.code === 11000) {
    statusCode = 409
    message = 'A record with this value already exists'
    code = 'DUPLICATE_KEY'
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    message = GENERIC_AUTH_MESSAGE
    expose = false
    code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
  } else if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    statusCode = 503
    message = 'Service temporarily unavailable'
    code = 'DATABASE_UNAVAILABLE'
  } else if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.expose === false && statusCode >= 500 ? GENERIC_SERVER_MESSAGE : err.message
    details = err.details
    code = err.code
    expose = err.expose !== false
  } else if (!err.isOperational && statusCode >= 500) {
    message = GENERIC_SERVER_MESSAGE
    expose = false
  }

  if (statusCode === 401 && !expose) {
    message = GENERIC_AUTH_MESSAGE
  }

  return { statusCode, message, details, code, expose }
}

export function errorHandler(err, req, res, _next) {
  const errorId = generateErrorId()
  const normalized = normalizeError(err)

  trackError(err, req, {
    errorId,
    statusCode: normalized.statusCode,
    code: normalized.code,
  })

  const payload = {
    success: false,
    message: normalized.message,
    statusCode: normalized.statusCode,
    errorId,
  }

  if (normalized.details) {
    payload.errors = normalized.details
  }

  if (process.env.NODE_ENV !== 'production') {
    if (normalized.code) payload.code = normalized.code
    if (err.stack && normalized.statusCode >= 500) {
      payload.stack = err.stack
    }
  }

  res.status(normalized.statusCode).json(payload)
}

export function notFound(_req, _res, next) {
  next(Errors.routeNotFound())
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  ServerError,
  Errors,
}
