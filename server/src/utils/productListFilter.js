import mongoose from 'mongoose'
import Category from '../models/Category.js'
import { buildSearchRegex, buildExactRegex } from './safeRegex.js'

/**
 * Apply list filters from req.query onto a Mongoose filter object.
 * Mutates `filter` and may return `{ empty: true }` when category name has no match.
 */
export async function applyProductListFilters(filter, query = {}) {
  const {
    search,
    category,
    stockStatus,
    minPrice,
    maxPrice,
    min,
    max,
    rating,
    minRating,
  } = query

  if (search?.trim()) {
    const regex = buildSearchRegex(search)
    if (regex) {
      filter.$or = [
        { name: regex },
        { name_uz: regex },
        { name_ru: regex },
        { name_en: regex },
        { sku: regex },
        { description: regex },
        { description_uz: regex },
        { description_ru: regex },
        { description_en: regex },
      ]
    }
  }

  if (category?.trim()) {
    const raw = category.trim()
    if (mongoose.Types.ObjectId.isValid(raw)) {
      filter.category = raw
    } else {
      const exact = buildExactRegex(raw)
      const cat = await Category.findOne({
        $or: [
          { name: exact },
          { name_uz: exact },
          { name_ru: exact },
          { name_en: exact },
          { slug: exact },
        ],
      }).select('_id').lean()

      if (!cat) return { empty: true }
      filter.category = cat._id
    }
  }

  if (stockStatus === 'inStock') {
    filter.stock = { $gt: 0 }
  } else if (stockStatus === 'outOfStock') {
    filter.stock = 0
  }

  const minVal = min ?? minPrice
  const maxVal = max ?? maxPrice
  const minNum = minVal !== undefined && minVal !== '' ? Number(minVal) : NaN
  const maxNum = maxVal !== undefined && maxVal !== '' ? Number(maxVal) : NaN

  if (!Number.isNaN(minNum) || !Number.isNaN(maxNum)) {
    const priceFilter = {}
    if (!Number.isNaN(minNum)) priceFilter.$gte = minNum
    if (!Number.isNaN(maxNum)) priceFilter.$lte = maxNum
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [{ price: priceFilter }, { basePrice: priceFilter }],
    })
  }

  const ratingMin = rating ?? minRating
  if (ratingMin !== undefined && ratingMin !== '') {
    const r = Number(ratingMin)
    if (!Number.isNaN(r)) {
      filter.rating = { $gte: r }
    }
  }

  return { empty: false }
}

export function parseProductPagination(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const page = Math.max(Number(query.page) || 1, 1)
  const skip =
    query.skip !== undefined && query.skip !== ''
      ? Math.max(Number(query.skip) || 0, 0)
      : (page - 1) * limit

  return { limit, page, skip }
}

export function parseProductSort(query = {}) {
  const sort = String(query.sort || 'newest').toLowerCase()

  switch (sort) {
    case 'price_asc':
      return { price: 1, basePrice: 1, createdAt: -1 }
    case 'price_desc':
      return { price: -1, basePrice: -1, createdAt: -1 }
    case 'rating':
    case 'popular':
      return { rating: -1, reviews_count: -1, viewCount: -1, createdAt: -1 }
    case 'bestseller':
      return { salesCount: -1, rating: -1, createdAt: -1 }
    case 'newest':
    default:
      return { createdAt: -1 }
  }
}
