import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import storeRoutes from './routes/store.routes.js'
import orderRoutes from './routes/orders.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import contactRoutes from './routes/contact.routes.js'
import productsRoutes from './routes/products.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'
import recommendationsRoutes from './routes/recommendations.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import blogRoutes from './routes/blog.routes.js'
import faqRoutes from './routes/faq.routes.js'
import galleryRoutes from './routes/gallery.routes.js'
import pagesRoutes from './routes/pages.routes.js'
import b2bRoutes from './routes/b2b.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import paymePaymentRoutes from './routes/payment/payme.js'
import cartRoutes from './routes/cart.routes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requireDb } from './middleware/requireDb.js'
import { uploadsDir } from './middleware/upload.js'
import { getDbStatus, pingDatabase } from './config/db.js'
import { getInstallmentPlans } from './controllers/installment.controller.js'
import { asyncHandler } from './utils/asyncHandler.js'
import { getCorsOrigins } from './utils/validateEnv.js'
import {
  helmetMiddleware,
  apiLimiter,
  mongoSanitizeMiddleware,
  xssCleanMiddleware,
  httpsRedirect,
} from './middleware/security.js'
import { issueCsrfToken } from './middleware/csrf.js'
import {
  requestTiming,
  requestCompletionLogger,
  httpLogger,
} from './middleware/logger.js'
import { isSwaggerEnabled, swaggerUiServe, swaggerUiSetup, swaggerSpec } from './swagger.js'

const app = express()

if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1)
}

app.use(helmetMiddleware)
app.use(requestTiming)
app.use(httpsRedirect)

/** HTTP request logging — morgan + custom completion logger */
if (process.env.NODE_ENV !== 'test') {
  app.use(httpLogger)
  app.use(requestCompletionLogger)
}

const allowedOrigins = getCorsOrigins()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(mongoSanitizeMiddleware)
app.use(xssCleanMiddleware)
app.use('/api/', apiLimiter)
app.use('/uploads', express.static(uploadsDir))

/** OpenAPI docs — http://localhost:5000/api-docs (dev) or SWAGGER_ENABLED=true in production */
if (isSwaggerEnabled()) {
  app.use('/api-docs', swaggerUiServe, swaggerUiSetup)
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec)
  })
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API and database are healthy
 *       503:
 *         description: API up but database unavailable
 */
app.get('/api/health', asyncHandler(async (_req, res) => {
  const db = getDbStatus()
  const alive = db.connected ? await pingDatabase() : false

  res.status(alive ? 200 : 503).json({
    success: alive,
    message: alive ? 'Exclusive API is running' : 'Exclusive API is up but database is unavailable',
    database: alive ? 'connected' : db.state,
    databaseError: db.error || undefined,
    port: Number(process.env.PORT) || 5000,
  })
}))

/** Public calculator — no DB required */
app.get('/api/orders/installment-plans', getInstallmentPlans)

/** CSRF token for file uploads and mutating forms */
app.get('/api/csrf-token', issueCsrfToken)

app.use('/api', requireDb)

app.use('/api/categories', categoriesRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/recommendations', recommendationsRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/faq', faqRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/pages', pagesRoutes)
app.use('/api/b2b', b2bRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment/payme', paymePaymentRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
