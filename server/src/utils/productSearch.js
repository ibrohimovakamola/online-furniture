import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import ProductView from '../models/ProductView.js'
import { pickLocalizedField } from './localize.js'
import { formatCatalogProduct } from './catalogFormatter.js'
import {
  applyProductListFilters,
  parseProductPagination,
} from './productListFilter.js'
import { parseFieldSelection, applyFieldSelection } from './fieldFilter.js'

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5

const PRICE_BUCKETS = [
  { key: '0-1000000', min: 0, max: 1000000 },
  { key: '1000000-3000000', min: 1000000, max: 3000000 },
  { key: '3000000-5000000', min: 3000000, max: 5000000 },
  { key: '5000000+', min: 5000000, max: null },
]

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildPublishedFilter() {
  return { isActive: { $ne: false }, isPublished: { $ne: false } }
}

export function highlightText(text, term) {
  if (!text || !term) return text || ''
  const safe = escapeRegex(term.trim())
  if (!safe) return text
  return String(text).replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>')
}

export function parseSearchTerm(raw) {
  const term = String(raw ?? '').trim()
  if (!term) return { term: '', regex: null }
  if (term.length > 120) {
    const err = new Error('Search query is too long')
    err.statusCode = 400
    throw err
  }
  return { term, regex: new RegExp(escapeRegex(term), 'i') }
}

function buildTextSearchOr(term, regex) {
  return [
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

export async function buildProductFilter(query = {}, { lang = 'uz', includeSearch = false } = {}) {
  const filter = buildPublishedFilter()
  const searchTerm = query.query ?? query.q ?? query.search ?? ''
  const filterQuery = { ...query }

  if (includeSearch) {
    delete filterQuery.search
    delete filterQuery.query
    delete filterQuery.q
  }

  const listResult = await applyProductListFilters(filter, filterQuery)
  if (listResult.empty) return { filter, empty: true }

  if (query.color?.trim()) {
    const colorRegex = new RegExp(escapeRegex(query.color.trim()), 'i')
    const colorField = `specifications.color_${lang}`
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [
        { [colorField]: colorRegex },
        { 'specifications.color_uz': colorRegex },
        { 'specifications.color_ru': colorRegex },
        { 'specifications.color_en': colorRegex },
        { 'filters.color': colorRegex },
        { colors: colorRegex },
      ],
    })
  }

  if (query.material?.trim()) {
    const materialRegex = new RegExp(escapeRegex(query.material.trim()), 'i')
    filter.$and = filter.$and || []
    filter.$and.push({
      $or: [
        { [`specifications.material_${lang}`]: materialRegex },
        { 'specifications.material_uz': materialRegex },
        { 'specifications.material_ru': materialRegex },
        { 'specifications.material_en': materialRegex },
        { 'filters.material': materialRegex },
        { materials: materialRegex },
      ],
    })
  }

  if (query.stockStatus === 'lowStock') {
    filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD }
  }

  if (includeSearch && searchTerm?.trim()) {
    const { regex } = parseSearchTerm(searchTerm)
    const categoryMatches = await Category.find({
      $or: [
        { name: regex },
        { name_uz: regex },
        { name_ru: regex },
        { name_en: regex },
        { slug: regex },
      ],
    })
      .select('_id')
      .lean()
    const orConditions = buildTextSearchOr(searchTerm, regex)
    if (categoryMatches.length) {
      orConditions.push({ category: { $in: categoryMatches.map((c) => c._id) } })
    }
    filter.$and = filter.$and || []
    filter.$and.push({ $or: orConditions })
  }

  return { filter, empty: false, searchTerm: searchTerm?.trim() || '' }
}

export function parseExtendedProductSort(query = {}) {
  const sort = String(query.sort || 'newest').toLowerCase()
  switch (sort) {
    case 'price_asc':
      return { effectivePrice: 1, createdAt: -1 }
    case 'price_desc':
      return { effectivePrice: -1, createdAt: -1 }
    case 'popular':
    case 'rating':
      return { rating: -1, reviews_count: -1, viewCount: -1, createdAt: -1 }
    case 'bestseller':
      return { salesCount: -1, rating: -1, createdAt: -1 }
    case 'newest':
    default:
      return { createdAt: -1 }
  }
}

function effectivePriceExpression() {
  return {
    $ifNull: ['$discountedPrice', { $ifNull: ['$price', '$basePrice'] }],
  }
}

function buildSortStage(sortKey) {
  const sort = parseExtendedProductSort({ sort: sortKey })
  if (sort.effectivePrice != null) {
    return { effectivePrice: sort.effectivePrice, createdAt: sort.createdAt ?? -1 }
  }
  return sort
}

async function resolveCategoryFacetNames(categoryIds, lang) {
  if (!categoryIds.length) return {}
  const cats = await Category.find({ _id: { $in: categoryIds } })
    .select('name name_uz name_ru name_en slug')
    .lean()
  return Object.fromEntries(
    cats.map((c) => [String(c._id), pickLocalizedField(c, 'name', lang) || c.slug || 'Unknown'])
  )
}

function buildPriceRangeFacets(docs) {
  const counts = Object.fromEntries(PRICE_BUCKETS.map((b) => [b.key, 0]))
  for (const doc of docs) {
    const price = doc.effectivePrice ?? doc.price ?? doc.basePrice ?? 0
    for (const bucket of PRICE_BUCKETS) {
      if (price >= bucket.min && (bucket.max == null || price < bucket.max)) {
        counts[bucket.key] += 1
        break
      }
    }
  }
  return PRICE_BUCKETS.map((b) => ({ range: b.key, count: counts[b.key] }))
}

function buildColorFacets(docs, lang) {
  const map = new Map()
  for (const doc of docs) {
    const color =
      pickLocalizedField(doc.specifications || {}, 'color', lang) ||
      doc.filters?.color ||
      ''
    if (!color) continue
    map.set(color, (map.get(color) || 0) + 1)
  }
  return [...map.entries()]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

function buildCategoryFacets(docs, nameMap) {
  const map = new Map()
  for (const doc of docs) {
    const id = String(doc.category?._id || doc.category || '')
    if (!id) continue
    map.set(id, (map.get(id) || 0) + 1)
  }
  return [...map.entries()]
    .map(([id, count]) => ({ name: nameMap[id] || id, count, categoryId: id }))
    .sort((a, b) => b.count - a.count)
}

export async function searchProductsAdvanced({
  query = {},
  lang = 'uz',
  req,
  includeSearch = false,
  includeHighlights = false,
}) {
  const { filter, empty, searchTerm } = await buildProductFilter(query, { lang, includeSearch })
  const { limit, page, skip } = parseProductPagination(query)
  const sortKey = query.sort || 'newest'
  const fieldSelection = parseFieldSelection(query)

  if (empty) {
    return {
      products: [],
      total: 0,
      page,
      limit,
      query: searchTerm || '',
      facets: { categories: [], priceRanges: [], colors: [] },
    }
  }

  const sortStage = buildSortStage(sortKey)

  const pipeline = [
    { $match: filter },
    { $addFields: { effectivePrice: effectivePriceExpression() } },
    {
      $facet: {
        paged: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        ],
        total: [{ $count: 'count' }],
        facetDocs: [
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          { $addFields: { effectivePrice: effectivePriceExpression() } },
          { $limit: 5000 },
        ],
      },
    },
  ]

  const [result] = await Product.aggregate(pipeline)
  const total = result?.total?.[0]?.count || 0
  const rawProducts = result?.paged || []
  const facetDocs = result?.facetDocs || []

  const categoryIds = [
    ...new Set(facetDocs.map((d) => String(d.category?._id || d.category || '')).filter(Boolean)),
  ]
  const categoryNameMap = await resolveCategoryFacetNames(categoryIds, lang)

  const facets = {
    categories: buildCategoryFacets(facetDocs, categoryNameMap),
    priceRanges: buildPriceRangeFacets(facetDocs),
    colors: buildColorFacets(facetDocs, lang),
  }

  const products = applyFieldSelection(
    rawProducts.map((p) => {
      const formatted = formatCatalogProduct(p, req, lang)
      if (!includeHighlights || !searchTerm) return formatted
      return {
        ...formatted,
        highlights: {
          name: highlightText(formatted.name, searchTerm),
          description: highlightText(formatted.description, searchTerm),
        },
      }
    }),
    fieldSelection
  )

  return { products, total, page, limit, query: searchTerm || '', facets }
}

export function trackProductView(productId, userId = null) {
  Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } }).catch(() => {})

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    ProductView.findOneAndUpdate(
      { user: userId, product: productId },
      { $inc: { viewCount: 1 }, lastViewedAt: new Date() },
      { upsert: true, setDefaultsOnInsert: true }
    ).catch(() => {})
  }
}

export async function incrementProductSalesCounts(items = []) {
  for (const item of items) {
    const id = item.product || item.productId
    if (!id) continue
    await Product.findByIdAndUpdate(id, {
      $inc: { salesCount: item.quantity || 1 },
    }).catch(() => {})
  }
}

export async function getTrendingProducts({ limit = 10, lang = 'uz', req }) {
  const products = await Product.find(buildPublishedFilter())
    .populate('category', 'name name_uz name_ru name_en slug')
    .sort({ viewCount: -1, rating: -1, createdAt: -1 })
    .limit(limit)
    .lean()

  return products.map((p) => formatCatalogProduct(p, req, lang))
}

export async function getBestsellerProducts({ limit = 10, lang = 'uz', req }) {
  let products = await Product.find(buildPublishedFilter())
    .populate('category', 'name name_uz name_ru name_en slug')
    .sort({ salesCount: -1, rating: -1 })
    .limit(limit)
    .lean()

  if (products.every((p) => !p.salesCount)) {
    const rows = await Order.aggregate([
      { $match: { paymentStatus: 'paid', isDeleted: { $ne: true } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: limit },
    ])
    const ids = rows.map((r) => r._id).filter(Boolean)
    if (ids.length) {
      products = await Product.find({ _id: { $in: ids }, ...buildPublishedFilter() })
        .populate('category', 'name name_uz name_ru name_en slug')
        .lean()
      const orderMap = Object.fromEntries(rows.map((r) => [String(r._id), r.quantity]))
      products.sort((a, b) => (orderMap[String(b._id)] || 0) - (orderMap[String(a._id)] || 0))
    }
  }

  return products.map((p) => formatCatalogProduct(p, req, lang))
}

export async function getSimilarProducts(productId, { limit = 8, lang = 'uz', req }) {
  const source = await Product.findOne({
    _id: productId,
    ...buildPublishedFilter(),
  }).lean()
  if (!source) return []

  const products = await Product.find({
    ...buildPublishedFilter(),
    category: source.category,
    _id: { $ne: source._id },
  })
    .populate('category', 'name name_uz name_ru name_en slug')
    .sort({ rating: -1, salesCount: -1, viewCount: -1 })
    .limit(limit)
    .lean()

  return products.map((p) => formatCatalogProduct(p, req, lang))
}

export async function getUserRecommendations(userId, { limit = 10, lang = 'uz', req }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return []

  const [views, orders] = await Promise.all([
    ProductView.find({ user: userId }).sort({ lastViewedAt: -1 }).limit(20).lean(),
    Order.find({ customer: userId, paymentStatus: 'paid', isDeleted: { $ne: true } })
      .select('items.product')
      .lean(),
  ])

  const viewedIds = views.map((v) => v.product)
  const purchasedIds = orders.flatMap((o) => o.items.map((i) => i.product))
  const excludeIds = [...new Set([...viewedIds, ...purchasedIds].map(String))]

  const seedIds = [...new Set([...viewedIds.slice(0, 5), ...purchasedIds.slice(0, 5)])]
  let categoryIds = []

  if (seedIds.length) {
    const seeds = await Product.find({ _id: { $in: seedIds } }).select('category').lean()
    categoryIds = [...new Set(seeds.map((s) => String(s.category)).filter(Boolean))]
  }

  const filter = { ...buildPublishedFilter(), _id: { $nin: excludeIds } }
  if (categoryIds.length) {
    filter.category = { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)) }
  }

  const products = await Product.find(filter)
    .populate('category', 'name name_uz name_ru name_en slug')
    .sort({ salesCount: -1, rating: -1, viewCount: -1 })
    .limit(limit)
    .lean()

  if (products.length >= limit) {
    return products.map((p) => formatCatalogProduct(p, req, lang))
  }

  const existingIds = [...excludeIds, ...products.map((p) => String(p._id))]
  const filler = await Product.find({
    ...buildPublishedFilter(),
    _id: { $nin: existingIds },
  })
    .populate('category', 'name name_uz name_ru name_en slug')
    .sort({ viewCount: -1, salesCount: -1, rating: -1 })
    .limit(limit - products.length)
    .lean()

  return [...products, ...filler].map((p) => formatCatalogProduct(p, req, lang))
}
