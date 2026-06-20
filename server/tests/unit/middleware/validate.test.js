import Joi from 'joi'
import { validateRequest } from '../../../src/middleware/validate.js'
import { ValidationError } from '../../../src/utils/AppError.js'

function runMiddleware(middleware, req = {}) {
  return new Promise((resolve, reject) => {
    const res = {}
    middleware(req, res, (err) => {
      if (err) reject(err)
      else resolve(req)
    })
  })
}

describe('validateRequest middleware', () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(1),
  })

  it('should pass valid body and set req.body', async () => {
    const middleware = validateRequest(schema)
    const req = { body: { email: 'test@example.com', age: 25, extra: 'strip' } }
    const result = await runMiddleware(middleware, req)
    expect(result.body.email).toBe('test@example.com')
    expect(result.body.extra).toBeUndefined()
    expect(result.validated.email).toBe('test@example.com')
  })

  it('should reject invalid body with ValidationError', async () => {
    const middleware = validateRequest(schema)
    const req = { body: { email: 'not-an-email' } }
    await expect(runMiddleware(middleware, req)).rejects.toBeInstanceOf(ValidationError)
  })

  it('should include field details in ValidationError', async () => {
    const middleware = validateRequest(schema)
    const req = { body: {} }
    try {
      await runMiddleware(middleware, req)
    } catch (err) {
      expect(err.statusCode).toBe(400)
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: expect.any(String) })])
      )
    }
  })

  it('should validate query when source is query', async () => {
    const querySchema = Joi.object({ page: Joi.number().integer().min(1).default(1) })
    const middleware = validateRequest(querySchema, { source: 'query' })
    const req = { query: { page: '2' } }
    const result = await runMiddleware(middleware, req)
    expect(result.validated.page).toBe(2)
  })
})
