import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { slugify, buildImageUrl } from '../utils/helpers.js'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function uniqueSlug(baseName) {
  let slug = slugify(baseName)
  if (!slug) slug = 'category'

  let candidate = slug
  let suffix = 0

  while (await Category.findOne({ slug: candidate })) {
    suffix += 1
    candidate = `${slug}-${suffix}`
  }

  return candidate
}

function formatCategory(category, req, productCount = 0) {
  const doc = category.toObject ? category.toObject() : category
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || '',
    image: doc.image ? buildImageUrl(doc.image.replace(/^\/uploads\//, ''), req) : null,
    isActive: doc.isActive !== false,
    productCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export const listCategories = asyncHandler(async (req, res) => {
  const { search = '' } = req.query
  const filter = {}

  if (search.trim()) {
    filter.name = new RegExp(search.trim(), 'i')
  }

  const categories = await Category.find(filter).sort({ name: 1 })
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))

  res.json({
    success: true,
    categories: categories.map((cat) =>
      formatCategory(cat, req, countMap[String(cat._id)] || 0)
    ),
  })
})

export const createCategory = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim()
  if (!name) throw new AppError('Category name is required', 400)

  const namePattern = new RegExp(`^${escapeRegex(name)}$`, 'i')
  const existing = await Category.findOne({
    $or: [{ name: namePattern }, { slug: slugify(name) }],
  })

  if (existing) {
    throw new AppError(`Category "${existing.name}" already exists`, 409)
  }

  const slug = await uniqueSlug(name)
  const imageFilename = req.file?.filename ?? null

  try {
    const category = await Category.create({
      name,
      slug,
      description: String(req.body.description || '').trim(),
      image: imageFilename,
      isActive: true,
    })

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: formatCategory(category, req, 0),
    })
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Category name or slug already exists', 409)
    }
    throw err
  }
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const name = req.body.name?.trim()
  if (name && name.toLowerCase() !== category.name.toLowerCase()) {
    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    })
    if (duplicate) throw new AppError(`Category "${duplicate.name}" already exists`, 409)

    category.name = name
    category.slug = await uniqueSlug(name)
  }

  if (req.body.description !== undefined) {
    category.description = String(req.body.description).trim()
  }

  if (req.file?.filename) {
    category.image = req.file.filename
  }

  await category.save()
  const productCount = await Product.countDocuments({ category: category._id })
  res.json({
    success: true,
    message: 'Category updated successfully',
    category: formatCategory(category, req, productCount),
  })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const linked = await Product.countDocuments({ category: category._id })
  if (linked > 0) {
    throw new AppError('Cannot delete category with linked products', 400)
  }

  await category.deleteOne()
  res.json({ success: true, message: 'Category deleted' })
})
