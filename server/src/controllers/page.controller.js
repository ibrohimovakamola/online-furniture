import Page from '../models/Page.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parseCreatePage, parseUpdatePage } from '../validators/page.schema.js'

export function formatPage(doc) {
  const item = doc.toObject ? doc.toObject() : doc
  return {
    id: item._id,
    slug: item.slug,
    title: item.title,
    content: item.content,
    description: item.description || '',
    keywords: item.keywords || [],
    published: item.published,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/** GET /api/pages/:slug */
export const getPublicPage = asyncHandler(async (req, res) => {
  const page = await Page.findOne({
    slug: String(req.params.slug).toLowerCase(),
    published: true,
  })

  if (!page) throw new AppError('Page not found', 404)

  res.json({
    success: true,
    page: formatPage(page),
  })
})

/** GET /api/admin/pages/:pageName — get single CMS page (about, privacy, terms, contact) */
export const getAdminPageByName = asyncHandler(async (req, res) => {
  const slug = String(req.params.pageName || req.params.slug).toLowerCase()
  const page = await Page.findOne({ slug })

  if (!page) throw new AppError('Page not found', 404)

  res.json({
    success: true,
    data: { page: formatPage(page) },
  })
})

/** GET /api/admin/pages */
export const listAdminPages = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const pageNum = Math.max(Number(q.page) || 1, 1)
  const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 100)
  const skip = (pageNum - 1) * limit

  const [pages, total] = await Promise.all([
    Page.find().sort({ slug: 1 }).skip(skip).limit(limit),
    Page.countDocuments(),
  ])

  res.json({
    success: true,
    data: {
      items: pages.map(formatPage),
      total,
      page: pageNum,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  })
})

/** POST /api/admin/pages */
export const createPage = asyncHandler(async (req, res) => {
  const parsed = parseCreatePage(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const data = parsed.data
  const exists = await Page.findOne({ slug: data.slug })
  if (exists) throw new AppError('A page with this slug already exists', 409)

  const page = await Page.create(data)

  res.status(201).json({
    success: true,
    page: formatPage(page),
  })
})

/** PUT /api/admin/pages/:pageName */
export const updatePage = asyncHandler(async (req, res) => {
  const parsed = parseUpdatePage(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const slug = String(req.params.pageName || req.params.slug).toLowerCase()
  const page = await Page.findOneAndUpdate({ slug }, parsed.data, {
    new: true,
    runValidators: true,
  })

  if (!page) throw new AppError('Page not found', 404)

  res.json({
    success: true,
    data: { page: formatPage(page) },
  })
})

/** DELETE /api/admin/pages/:pageName */
export const deletePage = asyncHandler(async (req, res) => {
  const slug = String(req.params.pageName || req.params.slug).toLowerCase()
  const result = await Page.deleteOne({ slug })
  if (!result.deletedCount) throw new AppError('Page not found', 404)

  res.json({ success: true, message: 'Page deleted' })
})
