/**
 * Application error hierarchy for consistent HTTP error handling.
 *
 * Status codes:
 * - 400 Bad Request — validation / malformed input
 * - 401 Unauthorized — missing or invalid auth token
 * - 403 Forbidden — authenticated but insufficient permissions
 * - 404 Not Found — resource does not exist
 * - 409 Conflict — duplicate / already exists
 * - 422 Unprocessable Entity — valid input but business rule prevents processing
 * - 500 Server Error — unexpected failure
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.expose = options.expose !== false
    this.details = options.details ?? null
    this.code = options.code ?? null
    Error.captureStackTrace?.(this, this.constructor)
    this.name = this.constructor.name
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, { details, code: 'VALIDATION_ERROR' })
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401, { expose: false, code: 'AUTHENTICATION_ERROR' })
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, { code: 'AUTHORIZATION_ERROR' })
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, { code: 'NOT_FOUND' })
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A record with this value already exists') {
    super(message, 409, { code: 'CONFLICT' })
  }
}

/** Valid request shape but cannot be processed (business / semantic rules) */
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unable to process this request', details = null) {
    super(message, 422, { details, code: 'UNPROCESSABLE_ENTITY' })
  }
}

export class ServerError extends AppError {
  constructor(message = 'Something went wrong. Please try again later.') {
    super(message, 500, { expose: false, code: 'SERVER_ERROR' })
  }
}

/** Payment / gateway failures (502 Bad Gateway) */
export class PaymentGatewayError extends AppError {
  constructor(message = 'Payment gateway error') {
    super(message, 502, { code: 'PAYMENT_GATEWAY_ERROR' })
  }
}

/** Named factories for common business errors */
export const Errors = {
  invalidEmail: (message = 'Invalid email format') => new ValidationError(message),
  weakPassword: (message = 'Password does not meet security requirements') =>
    new ValidationError(message),
  emailRegistered: () =>
    new ConflictError('Unable to create account with these details'),
  productNotFound: () => new NotFoundError('Product not found'),
  orderNotFound: () => new NotFoundError('Order not found'),
  insufficientStock: (message = 'Insufficient stock') => new UnprocessableEntityError(message),
  invalidPaymentAmount: () => new UnprocessableEntityError('Invalid payment amount'),
  unprocessable: (message, details = null) => new UnprocessableEntityError(message, details),
  paymentGateway: (message) => new PaymentGatewayError(message),
  databaseUnavailable: () =>
    new AppError('Service temporarily unavailable', 503, {
      code: 'DATABASE_UNAVAILABLE',
      expose: true,
    }),
  routeNotFound: () => new NotFoundError('Route not found'),
}
