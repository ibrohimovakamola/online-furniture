import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatStoreProduct } from '../utils/productFormatter.js'

export const listStoreProducts = asyncHandler(async (req, res) => {
  const { search = '', category, limit = 50 } = req.query
  const filter = { isPublished: true }

  if (category) filter.category = category
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i')
    filter.$or = [{ name: regex }, { description: regex }, { sku: regex }]
  }

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(Number(limit))

  res.json({
    success: true,
    products: products.map((p) => formatStoreProduct(p, req)),
  })
})

export const getStoreProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isPublished: true,
  }).populate('category', 'name slug')

  if (!product) throw new AppError('Product not found', 404)

  res.json({ success: true, product: formatStoreProduct(product, req) })
})

export const listStoreCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 })
  res.json({
    success: true,
    categories: (categories ?? []).map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image
        ? c.image.startsWith('http')
          ? c.image
          : `${req.protocol}://${req.get('host')}/uploads/${c.image.replace(/^\/uploads\//, '')}`
        : null,
    })),
  })
})
