import express from 'express'
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
import paymentRoutes from './routes/payment.js'
import paymePaymentRoutes from './routes/payment/payme.js'
import cartRoutes from './routes/cart.routes.js'
import healthRoutes from './routes/health.routes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requireDb } from './middleware/requireDb.js'
import { uploadsDir } from './middleware/upload.js'
import { getInstallmentPlans } from './controllers/installment.controller.js'
import { corsMiddleware } from './config/cors.js'
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
import { resourceCleanup, maybeCollectGarbage } from './middleware/resourceCleanup.js'

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || (process.env.NODE_ENV === 'development' ? '2mb' : '10mb')

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

/**
 * CORS — browser storefront only (see config/cors.js).
 * Payment webhooks skip CORS (server-to-server, no Origin).
 * credentials: true for httpOnly refresh cookies across Vercel → Render.
 */
app.use(corsMiddleware)
app.use(cookieParser())
app.use(express.json({ limit: JSON_BODY_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }))
app.use(mongoSanitizeMiddleware)
app.use(xssCleanMiddleware)
app.use(resourceCleanup)
app.use(maybeCollectGarbage)
app.use('/api/', apiLimiter)
app.use('/uploads', express.static(uploadsDir))

/** OpenAPI docs — lazy-loaded to save RAM when SWAGGER_ENABLED=false */
if (process.env.SWAGGER_ENABLED !== 'false' && (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true')) {
  const { swaggerUiServe, swaggerUiSetup, getSwaggerSpec } = await import('./swagger.js')
  app.use('/api-docs', swaggerUiServe, swaggerUiSetup)
  app.get('/api-docs.json', (_req, res) => {
    res.json(getSwaggerSpec())
  })
}

/**
 * Health probe — public, registered before requireDb and auth (see routes/health.routes.js).
 */
app.use('/api/health', healthRoutes)

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
app.use('/api/payment', paymentRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
