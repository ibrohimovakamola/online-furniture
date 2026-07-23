#!/usr/bin/env node
/**
 * Standalone test product seeder (O'zbek mebellar).
 *
 *   cd server && npm run seed
 *   cd server && npm run seed -- --clear-all   # deletes ALL products first
 *
 * Requires: MONGODB_URI in server/.env (memory, local, or Atlas).
 * Admin user must exist (SEED_SUPER_ADMIN=true on first server boot).
 */
import '../src/utils/loadEnvBootstrap.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import Product from '../src/models/Product.js'
import Category from '../src/models/Category.js'
import User from '../src/models/User.js'
import { ROLES } from '../src/config/roles.js'
import { slugify } from '../src/utils/helpers.js'
import { seedSuperAdmin } from '../src/utils/seed.js'

const CATEGORY_BY_KEY = {
  divans: 'Sofas',
  tables: 'Office',
  beds: 'Beds',
  chairs: 'Chairs',
  dining: 'Dining',
}

const TEST_PRODUCTS = [
  {
    sku: 'KSL-TEST-001',
    name: "Sovit Divan (Chorniy)",
    name_uz: "Sovit divan (qora)",
    price: 2_500_000,
    categoryKey: 'divans',
    description: "Zamonaviy qora divan, 3 o'rinchali",
    description_uz: "Zamonaviy qora divan, 3 o'rinchali",
    mainImage: 'https://via.placeholder.com/300?text=Divan',
    stock: 15,
    rating: 4.5,
    reviews_count: 8,
  },
  {
    sku: 'KSL-TEST-002',
    name: 'Ofis Stoli (Oq)',
    name_uz: 'Ofis stoli (oq)',
    price: 850_000,
    categoryKey: 'tables',
    description: 'Kompyuter stoli, 120cm x 60cm',
    description_uz: 'Kompyuter stoli, 120cm x 60cm',
    mainImage: 'https://via.placeholder.com/300?text=Stol',
    stock: 25,
    rating: 4.2,
    reviews_count: 12,
  },
  {
    sku: 'KSL-TEST-003',
    name: 'Yotoq Krovati (Qora)',
    name_uz: 'Yotoq krovati (qora)',
    price: 3_200_000,
    categoryKey: 'beds',
    description: "Orto o'lcham yotoq, King Size",
    description_uz: "Orto o'lcham yotoq, King Size",
    mainImage: 'https://via.placeholder.com/300?text=Krovati',
    stock: 8,
    rating: 4.7,
    reviews_count: 5,
  },
  {
    sku: 'KSL-TEST-004',
    name: 'Ofis Stuli (Qora)',
    name_uz: 'Ofis stuli (qora)',
    price: 450_000,
    categoryKey: 'chairs',
    description: 'Ergonomik ofis stuli, aylanuvchi',
    description_uz: 'Ergonomik ofis stuli, aylanuvchi',
    mainImage: 'https://via.placeholder.com/300?text=Stulya',
    stock: 40,
    rating: 4.3,
    reviews_count: 18,
  },
  {
    sku: 'KSL-TEST-005',
    name: "Ovqatlanish Stoli (Oq)",
    name_uz: "Ovqatlanish stoli (oq)",
    price: 1_200_000,
    categoryKey: 'dining',
    description: "Oq-qora ovqatlanish stoli, 6 o'rinchali",
    description_uz: "Oq-qora ovqatlanish stoli, 6 o'rinchali",
    mainImage: 'https://via.placeholder.com/300?text=AshliStol',
    stock: 12,
    rating: 4.6,
    reviews_count: 9,
  },
]

async function ensureCategory(categoryName) {
  let category = await Category.findOne({ name: categoryName })
  if (!category) {
    category = await Category.create({
      name: categoryName,
      name_uz: categoryName,
      slug: slugify(categoryName),
    })
    console.log(`📁 Category created: ${categoryName}`)
  }
  return category
}

async function resolveCreatedBy() {
  const admin =
    (await User.findOne({ role: ROLES.SUPER_ADMIN })) ||
    (await User.findOne({ role: ROLES.ADMIN }))

  if (!admin) {
    throw new Error(
      'Admin user not found. Start the server once with SEED_SUPER_ADMIN=true in server/.env'
    )
  }
  return admin._id
}

function formatUzs(amount) {
  return `${Number(amount).toLocaleString('uz-UZ')} so'm`
}

async function seedData() {
  const clearAll = process.argv.includes('--clear-all')

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example → server/.env')
  }

  await connectDB(process.env.MONGODB_URI)
  console.log('🔗 Connected to MongoDB')

  await seedSuperAdmin()

  if (clearAll) {
    const { deletedCount } = await Product.deleteMany({})
    console.log(`🗑️ Cleared ${deletedCount} product(s) from database`)
  } else {
    const { deletedCount } = await Product.deleteMany({ sku: /^KSL-TEST-/ })
    if (deletedCount > 0) {
      console.log(`🗑️ Replaced ${deletedCount} previous test product(s)`)
    }
  }

  const createdBy = await resolveCreatedBy()
  const categoryCache = new Map()

  const docs = []
  for (const item of TEST_PRODUCTS) {
    const categoryName = CATEGORY_BY_KEY[item.categoryKey] || 'Sofas'
    if (!categoryCache.has(categoryName)) {
      categoryCache.set(categoryName, await ensureCategory(categoryName))
    }
    const category = categoryCache.get(categoryName)

    docs.push({
      name: item.name,
      name_uz: item.name_uz,
      sku: item.sku,
      slug: slugify(`${item.name}-${item.sku}`),
      description: item.description,
      description_uz: item.description_uz,
      price: item.price,
      basePrice: item.price,
      category: category._id,
      stock: item.stock,
      rating: item.rating,
      reviews_count: item.reviews_count,
      mainImage: item.mainImage,
      imageUrls: [item.mainImage],
      images: [{ url: item.mainImage, type: 'main', sortOrder: 0 }],
      colors: ['#1a2626'],
      isPublished: true,
      isActive: true,
      createdBy,
    })
  }

  const inserted = await Product.insertMany(docs)
  console.log(`✅ ${inserted.length} ta mahsulot qo'shildi`)

  const all = await Product.find({ sku: /^KSL-TEST-/ }).sort({ sku: 1 }).populate('category', 'name')
  console.log('\n📦 Database Contents (test products):')
  all.forEach((p, i) => {
    const cat = p.category?.name || '—'
    console.log(
      `${i + 1}. ${p.name} — ${formatUzs(p.basePrice)} (${p.stock} ta, ${cat})`
    )
  })

  await disconnectDB()
  console.log('\n✅ Seed completed successfully!')
}

seedData().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
