import { ValidationError } from '../utils/AppError.js'

/**
 * Joi request validation — passes ValidationError to global error handler on failure.
 */
export function validateRequest(schema, options = {}) {
  const source = options.source || 'body'

  return (req, res, next) => {
    const target = req[source]
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    })

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.') || source,
        message: d.message.replace(/"/g, ''),
      }))
      return next(new ValidationError('Validation failed', details))
    }

    req.validated = value
    if (source === 'body') {
      req.body = value
    }

    next()
  }
}

export default validateRequest
