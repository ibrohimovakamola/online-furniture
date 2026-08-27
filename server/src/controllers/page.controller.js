import Page from '../models/Page.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parseCreatePage, parseUpdatePage } from '../validators/page.schema.js'

export function formatPage(doc) {
  const item = doc.toObject ? doc.toObject() : doc
  const status = item.status || (item.published ? 'published' : 'draft')
  return {
    id: item._id,
    slug: item.slug,
    title: item.title,
    content: item.content,
    description: item.description || '',
    keywords: item.keywords || [],
    published: status === 'published',
    status,
    seoTitle: item.seoTitle || '',
    focusKeyword: item.focusKeyword || '',
    featuredImage: item.featuredImage || '',
    ogTitle: item.ogTitle || '',
    ogDescription: item.ogDescription || '',
    ogImage: item.ogImage || '',
    template: item.template || 'default',
    translations: item.translations || { uz: {}, ru: {}, en: {} },
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

/** GET /api/admin/pages/:pageName — get single CMS page */
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
  const status = q.status ? String(q.status) : null
  const search = q.search ? String(q.search).trim() : ''

  const filter = {}
  if (status === 'published') filter.published = true
  else if (status === 'draft') filter.$or = [{ status: 'draft' }, { published: false, status: { $ne: 'archived' } }]
  else if (status === 'archived') filter.status = 'archived'
  if (search) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
        ],
      },
    ]
  }

  const [pages, total] = await Promise.all([
    Page.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Page.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: {
      items: pages.map(formatPage),
      pages: pages.map(formatPage),
      total,
      page: pageNum,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  })
})

/** GET /api/admin/pages/check-slug/:slug */
export const checkPageSlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '')
    .trim()
    .toLowerCase()
  const exclude = req.query.exclude ? String(req.query.exclude).toLowerCase() : null

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.json({ success: true, available: false, reason: 'invalid' })
  }

  const existing = await Page.findOne({ slug }).select('slug')
  const available = !existing || (exclude && existing.slug === exclude)

  res.json({ success: true, available, slug })
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

/** POST /api/admin/pages/:pageName/duplicate */
export const duplicatePage = asyncHandler(async (req, res) => {
  const slug = String(req.params.pageName || req.params.slug).toLowerCase()
  const source = await Page.findOne({ slug })
  if (!source) throw new AppError('Page not found', 404)

  const base = `${source.slug}-copy`
  let nextSlug = base
  let n = 2
  while (await Page.findOne({ slug: nextSlug })) {
    nextSlug = `${base}-${n}`
    n += 1
  }

  const copy = await Page.create({
    slug: nextSlug,
    title: `${source.title} (Copy)`,
    content: source.content,
    description: source.description,
    keywords: source.keywords,
    status: 'draft',
    published: false,
    seoTitle: source.seoTitle,
    focusKeyword: source.focusKeyword,
    featuredImage: source.featuredImage,
    ogTitle: source.ogTitle,
    ogDescription: source.ogDescription,
    ogImage: source.ogImage,
    template: source.template,
    translations: source.translations,
  })

  res.status(201).json({
    success: true,
    page: formatPage(copy),
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
