#!/usr/bin/env node
/**
 * Sync MongoDB indexes for all models (run after deploy or schema changes).
 *
 *   cd server && node scripts/ensureIndexes.js
 */
import '../src/utils/loadEnvBootstrap.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import User from '../src/models/User.js'
import Product from '../src/models/Product.js'
import Order from '../src/models/Order.js'
import Review from '../src/models/Review.js'
import Category from '../src/models/Category.js'
import Cart from '../src/models/Cart.js'
import { logApp } from '../src/utils/appLogger.js'

const models = [User, Product, Order, Review, Category, Cart]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri || uri === 'memory') {
    console.error('Set MONGODB_URI to your Atlas cluster before running ensureIndexes.')
    process.exit(1)
  }

  await connectDB(uri)

  for (const Model of models) {
    const name = Model.modelName
    logApp('info', `[indexes] Syncing ${name}…`)
    await Model.syncIndexes()
    const indexes = await Model.collection.indexes()
    logApp('info', `[indexes] ${name}: ${indexes.length} index(es)`)
  }

  await disconnectDB()
  logApp('info', '[indexes] Done.')
}

main().catch((err) => {
  logApp('error', '[indexes] Failed', { message: err.message, stack: err.stack })
  process.exit(1)
})
