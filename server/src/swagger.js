import path from 'path'
import { fileURLToPath } from 'url'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Mebel Sotish API',
    version: '1.0.0',
    description: `
REST API for **mebelsotish.uz** — O'zbek mebel e-commerce platform.

## Authentication
Most protected routes require a JWT access token:
\`Authorization: Bearer <accessToken>\`

Obtain a token via \`POST /api/auth/login\` or \`POST /api/auth/signup\`.
Refresh tokens are sent as httpOnly cookies on login; call \`POST /api/auth/refresh\` to rotate.

## Response format
\`\`\`json
{ "success": true, "data": { ... }, "message": "..." }
\`\`\`

## Errors
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errorId": "ERR-A1B2C3",
  "errors": [{ "field": "email", "message": "..." }]
}
\`\`\`

| Code | Meaning |
|------|---------|
| 400 | Validation / bad request |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Business rule violation |
| 500 | Server error |

## Rate limits
| Route group | Limit |
|-------------|-------|
| General API | 100 req/hour per IP |
| Login | 5 attempts / 15 min |
| Password reset | 3 req/hour |
| Contact form | 10 req/hour |
    `,
    contact: {
      name: 'Mebel Sotish',
      url: 'https://mebelsotish.uz',
    },
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local development' },
    { url: 'https://mebelsotish.uz', description: 'Production' },
  ],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'Registration, login, tokens, profile' },
    { name: 'Products', description: 'Product catalog and search' },
    { name: 'Categories', description: 'Product categories' },
    { name: 'Cart', description: 'Authenticated shopping cart' },
    { name: 'Orders', description: 'Checkout and order management' },
    { name: 'Admin', description: 'Admin panel (JWT + admin role required)' },
    { name: 'Reviews', description: 'Product reviews' },
    { name: 'Payments', description: 'Payme & Click gateways' },
    { name: 'Store', description: 'Storefront settings & flash sale' },
    { name: 'Contact', description: 'Contact form' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /api/auth/login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          statusCode: { type: 'integer' },
          errorId: { type: 'string', example: 'ERR-A1B2C3' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'customer@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass1!' },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', description: '8+ chars, letter, digit, special' },
          name: { type: 'string', example: 'Ali Valiyev' },
          phone: { type: 'string', example: '+998901234567' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          token: { type: 'string', description: 'JWT access token' },
          user: { type: 'object' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Invalid credentials', statusCode: 401, errorId: 'ERR-X1Y2Z3' },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      ValidationError: {
        description: 'Validation failed (400)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded (429)',
        content: {
          'application/json': {
            example: { success: false, message: 'Too many requests from this IP. Try again later.' },
          },
        },
      },
    },
  },
}

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    `${__dirname}/docs/swagger/**/*.js`.replace(/\\/g, '/'),
    `${__dirname}/routes/**/*.js`.replace(/\\/g, '/'),
    `${__dirname}/app.js`.replace(/\\/g, '/'),
  ],
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)

export const swaggerUiServe = swaggerUi.serve

export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Mebel Sotish API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
})

export function isSwaggerEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true'
}
