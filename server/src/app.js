import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import storeRoutes from './routes/store.routes.js'
import { listStoreCategories } from './controllers/store.controller.js'
import orderRoutes from './routes/orders.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import contactRoutes from './routes/contact.routes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { uploadsDir } from './middleware/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Exclusive API is running' })
})

/** Public category list (same data as /api/store/categories) */
app.get('/api/categories', listStoreCategories)

app.use('/api/auth', authRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
