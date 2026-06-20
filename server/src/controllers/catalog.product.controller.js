import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { slugify } from '../utils/helpers.js'
import {
  formatCatalogProduct,
  formatCatalogCategory,
  resolveLang,
} from '../utils/catalogFormatter.js'
import { logControllerError } from '../utils/controllerLogger.js'
import { searchProductsAdvanced, trackProductView } from '../utils/productSearch.js'
import { logProductView } from '../utils/activityLogger.js'

function parseSpecifications(body) {
  if (!body.specifications) return {}
  if (typeof body.specifications === 'string') {
    try {
      return JSON.parse(body.specifications)
    } catch {
      return {}
    }
  }
  return body.specifications
}

function parseImageUrls(body) {
  if (!body.imageUrls) return []
  if (typeof body.imageUrls === 'string') {
    try {
      const parsed = JSON.parse(body.imageUrls)
      return Array.isArray(parsed) ? parsed : [body.imageUrls]
    } catch {
      return body.imageUrls.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }
  if (Array.isArray(body.imageUrls)) return body.imageUrls
  return []
}

function buildImagesFromFiles(files, existingUrls = []) {
  const urls = [...existingUrls]
  const images = []

  const mainFile = files?.mainImage?.[0]
  if (mainFile?.filename) {
    urls.unshift(mainFile.filename)
    images.push({ url: mainFile.filename, type: 'main', sortOrder: 0 })
  }

  const galleryFiles = files?.galleryImages || []
  galleryFiles.forEach((file, idx) => {
    if (!file?.filename) return
    urls.push(file.filename)
    images.push({ url: file.filename, type: 'gallery', sortOrder: idx + 1 })
  })

  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  return {
    imageUrls: uniqueUrls,
    images,
    mainImage: uniqueUrls[0] || null,
    gallery: uniqueUrls.slice(1),
  }
}

function applyProductFields(product, body, fileMeta) {
  const nameUz = body.name_uz?.trim() || body.name?.trim()
  if (nameUz) {
    product.name_uz = nameUz
    product.name = nameUz
  }
  if (body.name_ru !== undefined) product.name_ru = String(body.name_ru).trim()
  if (body.name_en !== undefined) product.name_en = String(body.name_en).trim()

  if (body.description_uz !== undefined) product.description_uz = String(body.description_uz).trim()
  if (body.description_ru !== undefined) product.description_ru = String(body.description_ru).trim()
  if (body.description_en !== undefined) product.description_en = String(body.description_en).trim()
  if (body.description !== undefined) product.description = String(body.description).trim()

  const price = body.price != null ? Number(body.price) : body.basePrice != null ? Number(body.basePrice) : null
  if (price != null && !Number.isNaN(price)) {
    product.price = price
    product.basePrice = price
  }

  if (body.discount_percent !== undefined) {
    product.discount_percent = Number(body.discount_percent) || 0
  }

  if (body.category) product.category = body.category
  if (body.stock !== undefined) product.stock = Number(body.stock) || 0
  if (body.rating !== undefined) product.rating = Number(body.rating) || 0
  if (body.reviews_count !== undefined) product.reviews_count = Number(body.reviews_count) || 0
  if (body.sku?.trim()) product.sku = body.sku.trim()

  const isActive = body.isActive ?? body.isPublished
  if (isActive !== undefined) {
    product.isActive = isActive !== false && isActive !== 'false'
    product.isPublished = product.isActive
  }

  const specs = parseSpecifications(body)
  if (Object.keys(specs).length) {
    product.specifications = { ...(product.specifications?.toObject?.() || product.specifications || {}), ...specs }
  }

  if (fileMeta) {
    product.imageUrls = fileMeta.imageUrls
    product.images = fileMeta.images.length ? fileMeta.images : product.images
    product.mainImage = fileMeta.mainImage
    product.gallery = fileMeta.gallery
  } else {
    const urls = parseImageUrls(body)
    if (urls.length) {
      product.imageUrls = urls.map((u) => u.replace(/^\/uploads\//, ''))
      product.mainImage = product.imageUrls[0]
      product.gallery = product.imageUrls.slice(1)
      product.images = product.imageUrls.map((url, idx) => ({
        url,
        type: idx === 0 ? 'main' : 'gallery',
        sortOrder: idx,
      }))
    }
  }

  if (nameUz || product.name) {
    product.slug = slugify(nameUz || product.name) || product.slug
  }
}

async function assertValidCategory(categoryId) {
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('A valid category is required', 400)
  }
  const exists = await Category.findById(categoryId)
  if (!exists) throw new AppError('Category not found', 400)
}

function countImages(body, files) {
  const urlCount = parseImageUrls(body).length
  const fileCount =
    (files?.mainImage?.length || 0) + (files?.galleryImages?.length || 0)
  return Math.max(urlCount, fileCount)
}

/** GET /api/products — public catalog with filters, facets, sorting, pagination */
export const listCatalogProducts = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const query = req.validated || req.query

  const result = await searchProductsAdvanced({
    query,
    lang,
    req,
    includeSearch: false,
    includeHighlights: Boolean(query.search?.trim() || query.query?.trim()),
  })

  res.json({
    success: true,
    data: {
      products: result.products,
      total: result.total,
      page: result.page,
      limit: result.limit,
      facets: result.facets,
    },
  })
})

/** GET /api/products/:id — public single product (increments view count) */
export const getCatalogProduct = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: { $ne: false },
    isPublished: { $ne: false },
  })
    .populate('category', 'name name_uz name_ru name_en slug')
    .lean()

  if (!product) throw new AppError('Product not found', 404)

  trackProductView(product._id, req.user?._id)
  logProductView(product._id, req)

  res.json({
    success: true,
    data: {
      product: formatCatalogProduct(product, req, lang),
      viewCount: (product.viewCount || 0) + 1,
    },
  })
})

/** GET /api/products/search/:query — legacy path-based search */
export const searchCatalogProducts = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const term = String(req.params.query ?? '').trim()
  const query = { ...req.validated, ...req.query, query: term, search: term }

  const result = await searchProductsAdvanced({
    query,
    lang,
    req,
    includeSearch: Boolean(term),
    includeHighlights: Boolean(term),
  })

  res.json({
    success: true,
    data: {
      query: term,
      products: result.products,
      total: result.total,
      page: result.page,
      limit: result.limit,
      facets: result.facets,
    },
  })
})

/** POST /api/products — admin create with image upload */
export const createCatalogProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) throw new AppError('Authentication required', 401)

    const body = req.validated || req.body
    await assertValidCategory(body.category)

    const imageCount = countImages(body, req.files)
    if (imageCount < 3) {
      throw new AppError('At least 3 product images are required', 400)
    }

    const fileMeta = buildImagesFromFiles(req.files || {}, parseImageUrls(body))
    if (fileMeta.imageUrls.length < 3) {
      throw new AppError('At least 3 product images are required', 400)
    }

    const product = new Product({
      createdBy: req.user._id,
      sku: body.sku?.trim() || `SKU-${Date.now()}`,
    })

    applyProductFields(product, body, fileMeta)
    await product.save()
    await product.populate('category', 'name name_uz name_ru name_en slug')

    res.status(201).json({
      success: true,
      data: {
        product: formatCatalogProduct(product, req, resolveLang(req), { includeAllLocales: true }),
      },
    })
  } catch (err) {
    logControllerError('createCatalogProduct', err, { userId: req.user?._id })
    if (err.isOperational) throw err
    if (err.code === 11000) throw new AppError('SKU or slug already exists', 409)
    throw new AppError(err.message || 'Failed to create product', 500)
  }
})

/** PUT /api/products/:id — admin update */
export const updateCatalogProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new AppError('Product not found', 404)

  const body = req.validated || req.body
  if (body.category) await assertValidCategory(body.category)

  let fileMeta = null
  if (req.files && (req.files.mainImage?.length || req.files.galleryImages?.length)) {
    fileMeta = buildImagesFromFiles(req.files, product.imageUrls || [])
  } else if (body.imageUrls) {
    const urls = parseImageUrls(body)
    if (urls.length && urls.length < 3) {
      throw new AppError('At least 3 product images are required', 400)
    }
    if (urls.length >= 3) {
      fileMeta = buildImagesFromFiles({}, urls)
    }
  }

  applyProductFields(product, body, fileMeta)
  product.updatedBy = req.user._id
  await product.save()
  await product.populate('category', 'name name_uz name_ru name_en slug')

  res.json({
    success: true,
    data: {
      product: formatCatalogProduct(product, req, resolveLang(req), { includeAllLocales: true }),
    },
  })
})

/** DELETE /api/products/:id — admin */
export const deleteCatalogProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new AppError('Product not found', 404)
  res.json({ success: true, message: 'Product deleted' })
})

export { formatCatalogCategory }
