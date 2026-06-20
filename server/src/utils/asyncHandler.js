export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  ServerError,
  PaymentGatewayError,
  Errors,
} from './AppError.js'

/**
 * Wrap async route handlers — forwards rejected promises to Express error middleware.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
