import { isMemoryDbMode } from '../config/db.js'
import { seedSuperAdmin } from './seed.js'
import { seedSettings } from './seedSettings.js'
import { seedCategories } from './seedCategories.js'
import { seedAdminData } from './seedAdminData.js'
import { seedBlogsIfEmpty } from './seedBlogs.js'
import { seedBlogCategoriesIfEmpty } from './seedBlogCategories.js'
import { seedFaqIfEmpty } from './seedFaq.js'
import { seedPagesIfEmpty } from './seedPages.js'

/**
 * Ordered bootstrap — categories always run before products/orders demo data.
 * Never drops collections; only inserts when empty or missing defaults.
 */
export async function runBootstrapSeeds() {
  if (isMemoryDbMode()) {
    console.log('[seed] MONGODB_URI=memory — empty collections are auto-filled on each server start')
  }

  await seedSuperAdmin()
  await seedSettings()
  await seedCategories()
  await seedAdminData()
  await seedBlogCategoriesIfEmpty()
  await seedBlogsIfEmpty()
  await seedFaqIfEmpty()
  await seedPagesIfEmpty()
}
