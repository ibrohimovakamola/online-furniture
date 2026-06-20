import Product from '../models/Product.js'
import B2BFavorite from '../models/B2BFavorite.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import {
  formatB2BProduct,
  buildB2BProductFilter,
} from '../utils/b2bHelpers.js'
import { calculateB2BLinePrice, QUANTITY_DISCOUNT_TIERS } from '../config/b2b.js'

/** GET /api/b2b/products */
export const listB2BProducts = asyncHandler(async (req, res) => {
  const { minPrice, maxPrice, page = 1, limit = 24 } = req.query
  const filter = buildB2BProductFilter(req.query)
  const skip = (Math.max(Number(page), 1) - 1) * Math.min(Number(limit) || 24, 100)
  const take = Math.min(Number(limit) || 24, 100)

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    Product.countDocuments(filter),
  ])

  let filtered = products
  if (minPrice || maxPrice) {
    filtered = products.filter((p) => {
      const retail = p.discountedPrice ?? p.basePrice
      const wholesale = calculateB2BLinePrice({ retailPrice: retail, wholesalePrice: p.wholesalePrice }).wholesaleUnit
      if (minPrice && wholesale < Number(minPrice)) return false
      if (maxPrice && wholesale > Number(maxPrice)) return false
      return true
    })
  }

  res.json({
    success: true,
    products: filtered.map((p) => formatB2BProduct(p, req)),
    pagination: {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take) || 1,
    },
    discountTiers: QUANTITY_DISCOUNT_TIERS,
  })
})

/** GET /api/b2b/products/:id */
export const getB2BProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug').lean()
  if (!product || !product.isPublished) throw new AppError('Product not found', 404)

  res.json({ success: true, product: formatB2BProduct(product, req) })
})

/** GET /api/b2b/products/:id/pricing */
export const getB2BProductPricing = asyncHandler(async (req, res) => {
  const quantity = Math.max(Number(req.query.quantity) || 1, 1)
  const product = await Product.findById(req.params.id).lean()
  if (!product || !product.isPublished) throw new AppError('Product not found', 404)

  const retail = product.discountedPrice ?? product.basePrice
  const pricing = calculateB2BLinePrice({
    retailPrice: retail,
    wholesalePrice: product.wholesalePrice,
    quantity,
  })

  res.json({
    success: true,
    productId: product._id,
    name: product.name,
    retailPrice: retail,
    pricing,
    discountTiers: QUANTITY_DISCOUNT_TIERS,
  })
})

/** POST /api/b2b/calculate-price */
export const calculateBulkPrice = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, items } = req.body

  if (Array.isArray(items) && items.length) {
    const results = []
    for (const line of items) {
      const product = await Product.findById(line.productId)
      if (!product) continue
      const retail = product.discountedPrice ?? product.basePrice
      results.push({
        productId: product._id,
        name: product.name,
        pricing: calculateB2BLinePrice({
          retailPrice: retail,
          wholesalePrice: product.wholesalePrice,
          quantity: line.quantity || 1,
        }),
      })
    }
    const grandTotal = results.reduce((s, r) => s + r.pricing.lineTotal, 0)
    const totalSavings = results.reduce((s, r) => s + r.pricing.savings, 0)
    return res.json({ success: true, items: results, grandTotal, totalSavings })
  }

  const product = await Product.findById(productId)
  if (!product) throw new AppError('Product not found', 404)

  const retail = product.discountedPrice ?? product.basePrice
  const pricing = calculateB2BLinePrice({
    retailPrice: retail,
    wholesalePrice: product.wholesalePrice,
    quantity,
  })

  res.json({ success: true, pricing })
})

/** GET /api/b2b/favorites */
export const listB2BFavorites = asyncHandler(async (req, res) => {
  const favorites = await B2BFavorite.find({ user: req.user._id })
    .populate({ path: 'product', populate: { path: 'category', select: 'name slug' } })
    .sort({ createdAt: -1 })
    .lean()

  res.json({
    success: true,
    favorites: favorites
      .filter((f) => f.product?.isPublished)
      .map((f) => ({
        id: f._id,
        productId: f.product._id,
        addedAt: f.createdAt,
        product: formatB2BProduct(f.product, req),
      })),
  })
})

/** POST /api/b2b/favorites/:productId */
export const addB2BFavorite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId)
  if (!product || !product.isPublished) throw new AppError('Product not found', 404)

  const favorite = await B2BFavorite.findOneAndUpdate(
    { user: req.user._id, product: product._id },
    { user: req.user._id, product: product._id },
    { upsert: true, new: true }
  )

  res.status(201).json({ success: true, favoriteId: favorite._id, productId: product._id })
})

/** DELETE /api/b2b/favorites/:productId */
export const removeB2BFavorite = asyncHandler(async (req, res) => {
  await B2BFavorite.deleteOne({ user: req.user._id, product: req.params.productId })
  res.json({ success: true, message: 'Removed from favorites' })
})
