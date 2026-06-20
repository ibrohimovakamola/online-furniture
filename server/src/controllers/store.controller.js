import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatStoreProduct } from '../utils/productFormatter.js'
import { pickLocalizedField, resolveLang } from '../utils/localize.js'
import { applyProductListFilters } from '../utils/productListFilter.js'

export const listStoreProducts = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query
  const filter = { isPublished: true }

  const listResult = await applyProductListFilters(filter, req.query)
  if (listResult.empty) {
    return res.json({ success: true, products: [] })
  }

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(Number(limit))

  const lang = resolveLang(req)

  res.json({
    success: true,
    lang,
    products: products.map((p) => formatStoreProduct(p, req, lang)),
  })
})

export const getStoreProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isPublished: true,
  }).populate('category', 'name slug')

  if (!product) throw new AppError('Product not found', 404)

  const lang = resolveLang(req)
  res.json({ success: true, lang, product: formatStoreProduct(product, req, lang) })
})

export const listStoreCategories = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const categories = await Category.find({ isActive: true }).sort({ name: 1 })
  res.json({
    success: true,
    lang,
    categories: (categories ?? []).map((c) => ({
      id: String(c._id),
      name: pickLocalizedField(c, 'name', lang),
      slug: c.slug,
      description: pickLocalizedField(c, 'description', lang),
      image: c.image
        ? c.image.startsWith('http')
          ? c.image
          : `${req.protocol}://${req.get('host')}/uploads/${c.image.replace(/^\/uploads\//, '')}`
        : null,
    })),
  })
})
