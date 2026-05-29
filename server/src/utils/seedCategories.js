import Category from '../models/Category.js'
import { slugify } from './helpers.js'

/** Original 7 furniture categories — restored on every empty DB boot */
export const ORIGINAL_CATEGORIES = [
  { name: 'Bed', slug: 'bed' },
  { name: 'Beds', slug: 'beds' },
  { name: 'Chairs', slug: 'chairs' },
  { name: 'Dining', slug: 'dining' },
  { name: 'Office', slug: 'office' },
  { name: 'Sectionals', slug: 'sectionals' },
  { name: 'Sofas', slug: 'sofas' },
]

function escapeName(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findByName(name) {
  return Category.findOne({ name: new RegExp(`^${escapeName(name)}$`, 'i') })
}

async function uniqueSlug(baseName) {
  let slug = slugify(baseName)
  if (!slug) slug = 'category'
  let candidate = slug
  let suffix = 0
  while (await Category.findOne({ slug: candidate })) {
    suffix += 1
    candidate = `${slug}-${suffix}`
  }
  return candidate
}

/**
 * Direct Mongoose seed when collection is empty.
 */
export async function seedCategoriesIfEmpty() {
  const count = await Category.countDocuments()
  if (count > 0) {
    return { seeded: false, count }
  }

  const docs = await Category.insertMany(
    ORIGINAL_CATEGORIES.map(({ name, slug }) => ({
      name,
      slug,
      description: '',
      isActive: true,
    }))
  )

  console.log(
    `[startup] Category collection was empty — seeded ${docs.length} categories:`,
    ORIGINAL_CATEGORIES.map((c) => c.name).join(', ')
  )
  return { seeded: true, count: docs.length }
}

export async function seedCategories() {
  const emptyResult = await seedCategoriesIfEmpty()
  if (emptyResult.seeded) {
    return { created: emptyResult.count, total: emptyResult.count }
  }

  if (process.env.SEED_CATEGORIES === 'false') {
    const total = await Category.countDocuments()
    return { created: 0, total }
  }

  let added = 0
  for (const { name } of ORIGINAL_CATEGORIES) {
    if (!(await findByName(name))) {
      await Category.create({
        name,
        slug: await uniqueSlug(name),
        description: '',
        isActive: true,
      })
      added += 1
    }
  }

  const total = await Category.countDocuments()
  if (added > 0) {
    console.log(`[seed] Added ${added} missing original categories (total: ${total})`)
  }
  return { created: added, total }
}

/** Called immediately after MongoDB connects (server.js) */
export async function ensureDefaultCategories() {
  await seedCategoriesIfEmpty()
  const result = await seedCategories()
  const list = await Category.find({ isActive: { $ne: false } })
    .sort({ name: 1 })
    .select('name slug')
  console.log('[startup] Categories ready:', list.map((c) => `${c.name} (${c.slug})`).join(', '))
  return result
}
