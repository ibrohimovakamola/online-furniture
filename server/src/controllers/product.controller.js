import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { slugify } from '../utils/helpers.js'
import { formatAdminProduct } from '../utils/productFormatter.js'
import { normalizeHexColor, sanitizeColors } from '../utils/sanitizeColors.js'
import { buildCreatedAtFilter, parseDateRangeQuery } from '../utils/dateRange.js'
import { applyProductListFilters, parseProductPagination, parseProductSort } from '../utils/productListFilter.js'
import { logControllerError } from '../utils/controllerLogger.js'
import { buildPaginatedResponse } from '../utils/pagination.js'
import { logAdminAction } from '../utils/adminActionLog.js'

/** Parse filters from multipart JSON string or flat form fields */
function parseFilters(body) {
  if (body.filters) {
    if (typeof body.filters === 'string') {
      try {
        const parsed = JSON.parse(body.filters)
        if (typeof parsed === 'object' && parsed !== null) {
          return normalizeFilters(parsed)
        }
      } catch {
        /* fall through */
      }
    } else if (typeof body.filters === 'object') {
      return normalizeFilters(body.filters)
    }
  }

  return normalizeFilters({
    color: body.color,
    material: body.material,
    size: body.size,
    productType: body.productType || body.type,
  })
}

function pickFirstString(value) {
  if (Array.isArray(value)) return String(value[0] ?? '').trim()
  return String(value ?? '').trim()
}

function normalizeFilters(raw = {}) {
  const colorRaw = pickFirstString(raw.color)
  const validatedColor = normalizeHexColor(colorRaw) || ''

  return {
    color: validatedColor,
    material: pickFirstString(raw.material),
    size: pickFirstString(raw.size),
    productType: pickFirstString(raw.productType || raw.type),
  }
}

function parseProductBody(body) {
  let colors = sanitizeColors(body.colors ?? body.color)

  const filters = parseFilters(body)
  if (!filters.color && colors[0]) {
    filters.color = colors[0]
  } else if (filters.color && !colors.includes(filters.color)) {
    colors = [filters.color, ...colors]
  }

  const uniqueColors = [...new Set(colors)]

  const basePrice = Number(body.basePrice)
  const discountedRaw = body.discountedPrice
  const discountedPrice =
    discountedRaw !== undefined &&
    discountedRaw !== null &&
    String(discountedRaw).trim() !== ''
      ? Number(discountedRaw)
      : null

  return {
    name: body.name?.trim(),
    sku: body.sku?.trim() || undefined,
    description: body.description || '',
    basePrice,
    discountedPrice: Number.isNaN(discountedPrice) ? null : discountedPrice,
    category: body.category,
    stock: Number(body.stock) || 0,
    colors: uniqueColors,
    filters,
    isPublished: body.isPublished !== 'false' && body.isPublished !== false,
  }
}

async function assertValidCategory(categoryId) {
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('A valid category is required', 400)
  }
  const exists = await Category.findById(categoryId)
  if (!exists) throw new AppError('Category not found', 400)
}

function buildImagesFromFiles(files, existingImages = []) {
  const images = [...existingImages]
  let mainImage = null
  const gallery = []

  const mainFile = files?.mainImage?.[0]
  if (mainFile?.filename) {
    mainImage = mainFile.filename
    const mainIdx = images.findIndex((i) => i.type === 'main')
    const entry = { url: mainImage, type: 'main', sortOrder: 0 }
    if (mainIdx >= 0) images[mainIdx] = entry
    else images.unshift(entry)
  }

  const galleryFiles = files?.galleryImages || []
  galleryFiles.forEach((file, idx) => {
    if (!file?.filename) return
    gallery.push(file.filename)
    images.push({ url: file.filename, type: 'gallery', sortOrder: idx + 1 })
  })

  return { images, mainImage, gallery }
}

export const listProducts = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const dateFilter = buildCreatedAtFilter(parseDateRangeQuery(q))
  const filter = { ...dateFilter }

  const listResult = await applyProductListFilters(filter, q)
  if (listResult.empty) {
    return res.json(buildPaginatedResponse([], { total: 0, page: 1, limit: 20 }))
  }

  if (q.stockStatus === 'lowStock') {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 5
    filter.stock = { $gt: 0, $lte: threshold }
  }

  const { limit, page, skip } = parseProductPagination(q)
  const sort = parseProductSort(q)

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ])

  res.json(
    buildPaginatedResponse(
      products.map((p) => formatAdminProduct(p, req)),
      { total, page, limit }
    )
  )
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug')
  if (!product) throw new AppError('Product not found', 404)
  res.json({ success: true, product: formatAdminProduct(product, req) })
})

export const createProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      throw new AppError('Authenticated user is required to create products', 401)
    }

    const data = parseProductBody(req.body)

    if (!data.name?.trim()) {
      throw new AppError('Product name is required', 400)
    }
    if (Number.isNaN(data.basePrice) || data.basePrice < 0) {
      throw new AppError('A valid base price is required', 400)
    }
    if (!data.category) {
      throw new AppError('Category is required', 400)
    }

    await assertValidCategory(data.category)

    const { images, mainImage, gallery } = buildImagesFromFiles(req.files || {})
    if (!images.some((i) => i.type === 'main')) {
      throw new AppError('Main product image is required', 400)
    }

    const slugBase = slugify(data.name) || `product-${Date.now()}`
    const materials = data.filters?.material ? [data.filters.material] : []

    const product = await Product.create({
      ...data,
      materials,
      slug: slugBase,
      sku: data.sku || `SKU-${Date.now()}`,
      images,
      mainImage,
      gallery,
      createdBy: req.user._id,
    })

    await product.populate('category', 'name slug')
    res.status(201).json({ success: true, product: formatAdminProduct(product, req) })
  } catch (err) {
    logControllerError('createProduct', err, {
      bodyKeys: Object.keys(req.body || {}),
      fileFields: req.files ? Object.keys(req.files) : [],
      userId: req.user?._id,
    })
    if (err.isOperational) throw err
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors || {})
        .map((e) => e.message)
        .join('; ')
      throw new AppError(details || 'Product validation failed', 400)
    }
    if (err.code === 11000) {
      throw new AppError('SKU or slug already exists — use a unique name or SKU', 409)
    }
    throw new AppError(err.message || 'Failed to create product', 500)
  }
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new AppError('Product not found', 404)

  const data = parseProductBody(req.body)
  if (data.category) await assertValidCategory(data.category)

  let images = product.images.map((i) => i.toObject())

  if (req.body.existingImages) {
    try {
      images = JSON.parse(req.body.existingImages).map((img) => ({
        url: img.url?.includes('/uploads/') ? img.url.split('/uploads/').pop() : img.url,
        type: img.type,
        sortOrder: img.sortOrder || 0,
      }))
    } catch {
      /* keep */
    }
  }

  const built = buildImagesFromFiles(req.files, images)

  if (!built.images.some((i) => i.type === 'main')) {
    throw new AppError('Main product image is required', 400)
  }

  product.name = data.name || product.name
  product.sku = data.sku || product.sku
  product.description = data.description
  product.basePrice = data.basePrice
  product.discountedPrice = data.discountedPrice
  product.category = data.category || product.category
  product.stock = data.stock
  product.colors = data.colors
  product.filters = data.filters
  product.isPublished = data.isPublished
  product.slug = slugify(data.name || product.name)
  product.images = built.images.length ? built.images : images
  product.mainImage = built.mainImage || product.mainImage
  if (built.gallery.length) {
    product.gallery = [...(product.gallery || []), ...built.gallery]
  }
  product.updatedBy = req.user._id

  await product.save()
  await product.populate('category', 'name slug')
  res.json({ success: true, product: formatAdminProduct(product, req) })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new AppError('Product not found', 404)
  logAdminAction(req, 'product.delete', { productId: String(req.params.id) })
  res.json({ success: true, message: 'Product deleted' })
})

/** PUT /api/admin/products/:productId/stock */
export const updateProductStock = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const product = await Product.findById(req.params.productId || req.params.id)
  if (!product) throw new AppError('Product not found', 404)

  const previousStock = product.stock
  product.stock = body.stock
  product.updatedBy = req.user._id
  await product.save()
  await product.populate('category', 'name slug')

  logAdminAction(req, 'product.stock_update', {
    productId: String(product._id),
    previousStock,
    stock: body.stock,
    note: body.note || '',
  })

  res.json({
    success: true,
    message: 'Stock updated',
    data: { product: formatAdminProduct(product, req) },
  })
})

/** POST /api/admin/products/:productId/bulk-update */
export const bulkUpdateProduct = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const product = await Product.findById(req.params.productId || req.params.id)
  if (!product) throw new AppError('Product not found', 404)

  const fields = body.fields || body

  if (fields.name_uz) {
    product.name_uz = fields.name_uz
    product.name = fields.name_uz
  }
  if (fields.name !== undefined) product.name = fields.name
  if (fields.name_ru !== undefined) product.name_ru = fields.name_ru
  if (fields.name_en !== undefined) product.name_en = fields.name_en
  if (fields.description !== undefined) product.description = fields.description
  if (fields.basePrice !== undefined) product.basePrice = fields.basePrice
  if (fields.discountedPrice !== undefined) product.discountedPrice = fields.discountedPrice
  if (fields.stock !== undefined) product.stock = fields.stock
  if (fields.isPublished !== undefined) product.isPublished = fields.isPublished

  product.updatedBy = req.user._id
  await product.save()
  await product.populate('category', 'name slug')

  logAdminAction(req, 'product.bulk_update', {
    productId: String(product._id),
    fields: Object.keys(fields),
  })

  res.json({
    success: true,
    message: 'Product updated',
    data: { product: formatAdminProduct(product, req) },
  })
})
