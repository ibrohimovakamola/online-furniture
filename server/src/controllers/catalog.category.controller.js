import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { slugify, buildImageUrl } from '../utils/helpers.js'
import { formatCatalogCategory, resolveLang } from '../utils/catalogFormatter.js'
import { pickLocalizedField } from '../utils/localize.js'
import { logControllerError } from '../utils/controllerLogger.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function uniqueSlug(baseName, excludeId = null) {
  let slug = slugify(baseName)
  if (!slug) slug = 'category'

  let candidate = slug
  let suffix = 0

  while (true) {
    const filter = { slug: candidate }
    if (excludeId) filter._id = { $ne: excludeId }
    const exists = await Category.findOne(filter)
    if (!exists) return candidate
    suffix += 1
    candidate = `${slug}-${suffix}`
  }
}

function applyCategoryFields(category, body, imageFilename) {
  const nameUz = body.name_uz?.trim() || body.name?.trim()
  if (nameUz) {
    category.name_uz = nameUz
    category.name = nameUz
  }
  if (body.name_ru !== undefined) category.name_ru = String(body.name_ru).trim()
  if (body.name_en !== undefined) category.name_en = String(body.name_en).trim()

  if (body.description_uz !== undefined) category.description_uz = String(body.description_uz).trim()
  if (body.description_ru !== undefined) category.description_ru = String(body.description_ru).trim()
  if (body.description_en !== undefined) category.description_en = String(body.description_en).trim()
  if (body.description !== undefined) category.description = String(body.description).trim()

  if (body.slug?.trim()) {
    category.slug = body.slug.trim().toLowerCase()
  }

  if (body.isActive !== undefined) category.isActive = body.isActive !== false

  if (imageFilename) category.image = imageFilename
  else if (body.image !== undefined && body.image !== null && body.image !== '') {
    category.image = body.image.replace(/^\/uploads\//, '')
  }
}

/** GET /api/categories — public list with ?lang=uz */
export const listCatalogCategories = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const { search = '' } = req.query
  const filter = { isActive: { $ne: false } }

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i')
    filter.$or = [
      { name: regex },
      { name_uz: regex },
      { name_ru: regex },
      { name_en: regex },
      { slug: regex },
    ]
  }

  const categories = await Category.find(filter).sort({ name_uz: 1, name: 1 }).lean()

  res.json({
    success: true,
    data: {
      categories: categories.map((c) => formatCatalogCategory(c, req, lang)),
    },
  })
})

/** GET /api/categories/:id — public single category */
export const getCatalogCategory = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const category = await Category.findById(req.params.id).lean()
  if (!category || category.isActive === false) {
    throw new AppError('Category not found', 404)
  }

  res.json({
    success: true,
    data: {
      category: formatCatalogCategory(category, req, lang),
    },
  })
})

/** POST /api/categories — admin */
export const createCatalogCategory = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const nameUz = body.name_uz?.trim() || body.name?.trim()
  if (!nameUz) throw new AppError('name_uz is required', 400)

  const slug = body.slug?.trim().toLowerCase() || (await uniqueSlug(nameUz))
  const existing = await Category.findOne({
    $or: [{ slug }, { name_uz: new RegExp(`^${escapeRegex(nameUz)}$`, 'i') }],
  })
  if (existing) throw new AppError('Category with this name or slug already exists', 409)

  const imageFilename = req.file?.filename ?? (body.image ? body.image.replace(/^\/uploads\//, '') : null)

  try {
    const category = await Category.create({
      name: nameUz,
      name_uz: nameUz,
      name_ru: body.name_ru?.trim() || '',
      name_en: body.name_en?.trim() || '',
      slug,
      description: body.description_uz?.trim() || body.description?.trim() || '',
      description_uz: body.description_uz?.trim() || body.description?.trim() || '',
      description_ru: body.description_ru?.trim() || '',
      description_en: body.description_en?.trim() || '',
      image: imageFilename,
      isActive: body.isActive !== false,
    })

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: formatCatalogCategory(category, req, resolveLang(req), { includeAllLocales: true }),
      },
    })
  } catch (err) {
    if (err.code === 11000) throw new AppError('Category name or slug already exists', 409)
    throw err
  }
})

/** PUT /api/categories/:id — admin */
export const updateCatalogCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const body = req.validated || req.body
  applyCategoryFields(category, body, req.file?.filename)

  const nameUz = category.name_uz || category.name
  if (body.slug?.trim()) {
    const slug = body.slug.trim().toLowerCase()
    const duplicate = await Category.findOne({ _id: { $ne: category._id }, slug })
    if (duplicate) throw new AppError('Slug already in use', 409)
    category.slug = slug
  } else if (body.name_uz?.trim() && body.name_uz.trim() !== category.name_uz) {
    category.slug = await uniqueSlug(body.name_uz.trim(), category._id)
  } else if (!category.slug && nameUz) {
    category.slug = await uniqueSlug(nameUz, category._id)
  }

  await category.save()

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: {
      category: formatCatalogCategory(category, req, resolveLang(req), { includeAllLocales: true }),
    },
  })
})

/** DELETE /api/categories/:id — admin */
export const deleteCatalogCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const linked = await Product.countDocuments({ category: category._id })
  if (linked > 0) {
    throw new AppError('Cannot delete category with linked products', 400)
  }

  await category.deleteOne()
  res.json({ success: true, message: 'Category deleted' })
})

/** Admin panel list — legacy shape with product counts */
export const listCategories = asyncHandler(async (req, res) => {
  try {
    const q = req.validated || req.query
    const { search = '' } = q
    const { limit, page, skip } = parsePagination(q, { defaultLimit: 50, maxLimit: 100 })
    const filter = {}

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i')
      filter.$or = [{ name: regex }, { name_uz: regex }, { name_ru: regex }, { name_en: regex }]
    }

    const [categories, total] = await Promise.all([
      Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ])

    let countMap = {}

    try {
      const counts = await Product.aggregate([
        { $match: { category: { $ne: null } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ])
      countMap = Object.fromEntries(
        counts.filter((c) => c._id).map((c) => [String(c._id), c.count])
      )
    } catch (aggErr) {
      logControllerError('listCategories.aggregate', aggErr)
    }

    const lang = resolveLang(req)
    const items = (categories ?? []).map((cat) => {
      const base = formatCatalogCategory(cat, req, lang, { includeAllLocales: true })
      return {
        ...base,
        productCount: countMap[String(cat._id)] || 0,
        image: cat.image ? buildImageUrl(cat.image.replace(/^\/uploads\//, ''), req) : null,
      }
    })

    res.json(buildPaginatedResponse(items, { total, page, limit }))
  } catch (err) {
    logControllerError('listCategories', err, { query: req.query })
    if (err.isOperational) throw err
    throw new AppError(err.message || 'Failed to load categories', 500)
  }
})

export const createCategory = createCatalogCategory
export const updateCategory = updateCatalogCategory
export const deleteCategory = deleteCatalogCategory

export { pickLocalizedField }
