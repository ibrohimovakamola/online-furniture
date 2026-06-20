import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { resolveLang } from '../utils/catalogFormatter.js'
import { buildImageUrl } from '../utils/helpers.js'
import { parseSearchTerm, searchProductsAdvanced } from '../utils/productSearch.js'

function resolveSuggestionImage(product, req) {
  const images = product.images || []
  const mainFromImages = images.find((i) => i.type === 'main') || images[0]
  const raw = product.mainImage || mainFromImages?.url || null
  return buildImageUrl(raw, req)
}

function formatSuggestion(product, req) {
  return {
    id: String(product._id),
    name: product.name,
    category: product.category?.name || '',
    image: resolveSuggestionImage(product, req),
  }
}

/**
 * GET /api/products/suggestions?query=...&limit=5
 */
export const searchSuggestions = asyncHandler(async (req, res) => {
  const { term, regex } = parseSearchTerm(req.query.query ?? req.query.q ?? '')
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 10)

  if (!term) {
    return res.json({ success: true, query: '', suggestions: [] })
  }

  const matchingCategories = await Category.find({
    $or: [{ name: regex }, { name_uz: regex }, { name_ru: regex }, { name_en: regex }],
  })
    .select('_id')
    .lean()

  const orConditions = [
    { name: regex },
    { name_uz: regex },
    { name_ru: regex },
    { name_en: regex },
  ]
  if (matchingCategories.length) {
    orConditions.push({ category: { $in: matchingCategories.map((c) => c._id) } })
  }

  const products = await Product.find({
    isPublished: true,
    isActive: { $ne: false },
    $or: orConditions,
  })
    .select('_id name mainImage images category')
    .populate('category', 'name')
    .sort({ name: 1 })
    .limit(limit)
    .lean()

  res.json({
    success: true,
    query: term,
    suggestions: products.map((p) => formatSuggestion(p, req)),
  })
})

/**
 * GET /api/products/search?query=divan&lang=uz
 * Full-text search with highlights and faceted metadata.
 */
export const searchProducts = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const query = req.validated || req.query
  const searchQuery = query.query ?? query.q ?? query.search ?? ''

  const result = await searchProductsAdvanced({
    query: { ...query, query: searchQuery, search: searchQuery },
    lang,
    req,
    includeSearch: Boolean(String(searchQuery).trim()),
    includeHighlights: Boolean(String(searchQuery).trim()),
  })

  res.json({
    success: true,
    query: result.query,
    count: result.total,
    data: {
      products: result.products,
      total: result.total,
      page: result.page,
      limit: result.limit,
      facets: result.facets,
    },
    products: result.products,
  })
})
