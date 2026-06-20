import BlogCategory from '../models/BlogCategory.js'
import { slugify } from './helpers.js'

const DEFAULT_BLOG_CATEGORIES = [
  {
    name: 'Maslahat',
    slug: 'maslahat',
    description: 'Amaliy maslahatlar va interyer bo‘yicha yo‘riqnomalar.',
    color: '#1a5c3a',
    icon: 'lightbulb',
  },
  {
    name: 'Trend',
    slug: 'trend',
    description: 'So‘nggi mebel va dizayn trendlari.',
    color: '#0d4a7a',
    icon: 'trending-up',
  },
  {
    name: "Qo'llanma",
    slug: 'qollanma',
    description: 'Batafsil qo‘llanmalar va taqqoslashlar.',
    color: '#8a4b00',
    icon: 'book-open',
  },
  {
    name: 'Dizayn',
    slug: 'dizayn',
    description: 'Interyer dizayn g‘oyalari va ilhom.',
    color: '#5c2d7a',
    icon: 'palette',
  },
]

export async function seedBlogCategoriesIfEmpty() {
  const count = await BlogCategory.countDocuments()
  if (count > 0) return { seeded: false, total: count }

  await BlogCategory.insertMany(
    DEFAULT_BLOG_CATEGORIES.map((c) => ({ ...c, slug: c.slug || slugify(c.name) }))
  )
  console.log(`[seed] Blog categories seeded: ${DEFAULT_BLOG_CATEGORIES.length}`)
  return { seeded: true, total: DEFAULT_BLOG_CATEGORIES.length }
}

export { DEFAULT_BLOG_CATEGORIES }
