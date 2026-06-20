import { connectDB, disconnectDB } from '../src/config/db.js'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long'
process.env.REFRESH_SECRET = 'test-refresh-secret-min-32-chars-long'
process.env.MONGODB_URI = 'memory'
process.env.SEED_SUPER_ADMIN = 'false'
process.env.SEED_ADMIN_DATA = 'false'
process.env.SEED_CATEGORIES = 'false'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.CSRF_ENABLED = 'false'

beforeAll(async () => {
  await connectDB('memory')
})

afterAll(async () => {
  await disconnectDB()
})

afterEach(async () => {
  const mongoose = (await import('mongoose')).default
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
})
