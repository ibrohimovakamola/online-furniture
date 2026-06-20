import Blog from '../models/Blog.js'
import BlogCategory from '../models/BlogCategory.js'
import { ROLES } from '../config/roles.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { buildImageUrl, slugify } from '../utils/helpers.js'
import { getBlogFeaturedImageUrl } from '../config/blogImages.js'

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function calculateReadTime(content) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function resolveBlogImage(image, req) {
  if (!image?.trim()) return null
  if (image.startsWith('http') || image.startsWith('/')) return buildImageUrl(image, req) || image
  return buildImageUrl(image, req)
}

function parseKeywords(raw) {
  if (Array.isArray(raw)) return raw.map((k) => String(k).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((k) => String(k).trim()).filter(Boolean)
    } catch {
      /* comma-separated */
    }
    return raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  return []
}

function formatAdminPost(doc, req) {
  const b = doc.toObject ? doc.toObject() : doc
  const rawImage = getBlogFeaturedImageUrl(b)
  const imagePath = b.featuredImage || b.image || rawImage

  return {
    id: String(b._id),
    title: b.title,
    slug: b.slug,
    category: b.category,
    content: b.content,
    excerpt: stripHtml(b.content).slice(0, 160),
    metaDescription: b.metaDescription || '',
    keywords: b.keywords || [],
    readTime: b.readTime,
    author: b.author || 'Kresla Team',
    authorId: b.authorId ? String(b.authorId) : null,
    viewCount: b.viewCount ?? 0,
    commentCount: b.commentCount ?? 0,
    status: b.status || (b.isPublished ? 'published' : 'draft'),
    publishedAt: b.publishedAt,
    image: resolveBlogImage(imagePath, req),
    featuredImage: resolveBlogImage(imagePath, req),
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }
}

function canManagePost(user, post) {
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  if (user.role === ROLES.MANAGER) {
    if (!post.authorId) return true
    return String(post.authorId) === String(user._id)
  }
  return false
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug
  let n = 0
  while (true) {
    const filter = { slug }
    if (excludeId) filter._id = { $ne: excludeId }
    const exists = await Blog.exists(filter)
    if (!exists) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

function buildPostPayload(body, user, existing = null) {
  const title = String(body.title || '').trim()
  if (!title) throw new AppError('Title is required', 400)
  if (title.length > 100) throw new AppError('Title must be 100 characters or less', 400)

  const content = String(body.content || '').trim()
  if (!content) throw new AppError('Content is required', 400)

  const category = String(body.category || '').trim()
  if (!category) throw new AppError('Category is required', 400)

  const metaDescription = String(body.metaDescription || '').trim().slice(0, 160)
  const keywords = parseKeywords(body.keywords)
  const status = ['draft', 'published', 'scheduled'].includes(body.status)
    ? body.status
    : existing?.status || 'draft'

  let slug = String(body.slug || '').trim().toLowerCase() || slugify(title)
  if (!slug) slug = slugify(title)

  let publishedAt = body.publishedAt ? new Date(body.publishedAt) : existing?.publishedAt || null
  if (status === 'published' && !publishedAt) publishedAt = new Date()
  if (status === 'scheduled' && !publishedAt) {
    throw new AppError('Publication date is required for scheduled posts', 400)
  }

  const authorName =
    String(body.author || '').trim() ||
    (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
    existing?.author ||
    'Kresla Team'

  return {
    title,
    slug,
    category,
    content,
    metaDescription,
    keywords,
    status,
    publishedAt,
    readTime: calculateReadTime(content),
    author: authorName,
    authorId: existing?.authorId || user?._id,
  }
}


function bodyImageUrl(payload, body) {
  const url = String(body?.featuredImage || body?.image || '').trim()
  if (url && (url.startsWith('http') || url.startsWith('/'))) {
    payload.image = url
    payload.featuredImage = url
    return true
  }
  return false
}

/** GET /api/admin/blog/posts */
export const listAdminPosts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const skip = (page - 1) * limit
  const search = String(req.query.search || '').trim()
  const category = String(req.query.category || '').trim()
  const status = String(req.query.status || '').trim()
  const sort = String(req.query.sort || 'newest')

  const filter = {}

  if (req.user.role === ROLES.MANAGER) {
    filter.authorId = req.user._id
  }

  if (category) filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { title: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { slug: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ]
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
    views: { viewCount: -1 },
  }

  const [posts, total] = await Promise.all([
    Blog.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit),
    Blog.countDocuments(filter),
  ])

  res.json({
    success: true,
    posts: posts.map((p) => formatAdminPost(p, req)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  })
})

/** GET /api/admin/blog/posts/:id */
export const getAdminPost = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id)
  if (!post) throw new AppError('Blog post not found', 404)
  if (!canManagePost(req.user, post)) throw new AppError('Not allowed to view this post', 403)

  res.json({ success: true, post: formatAdminPost(post, req) })
})

/** POST /api/admin/blog/posts */
export const createAdminPost = asyncHandler(async (req, res) => {
  const payload = buildPostPayload(req.body, req.user)
  payload.slug = await ensureUniqueSlug(payload.slug)

  if (req.file?.filename) {
    payload.image = req.file.filename
    payload.featuredImage = req.file.filename
  } else {
    bodyImageUrl(payload, req.body)
  }

  const post = await Blog.create(payload)
  res.status(201).json({ success: true, post: formatAdminPost(post, req) })
})

/** PUT /api/admin/blog/posts/:id */
export const updateAdminPost = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id)
  if (!post) throw new AppError('Blog post not found', 404)
  if (!canManagePost(req.user, post)) throw new AppError('Not allowed to edit this post', 403)

  const payload = buildPostPayload(req.body, req.user, post)
  if (payload.slug !== post.slug) {
    payload.slug = await ensureUniqueSlug(payload.slug, post._id)
  }

  if (req.file?.filename) {
    payload.image = req.file.filename
    payload.featuredImage = req.file.filename
  } else if (req.body.removeImage === 'true') {
    payload.image = ''
    payload.featuredImage = ''
  } else {
    bodyImageUrl(payload, req.body)
  }

  Object.assign(post, payload)
  await post.save()

  res.json({ success: true, post: formatAdminPost(post, req) })
})

/** PATCH /api/admin/blog/posts/:id/status */
export const patchAdminPostStatus = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id)
  if (!post) throw new AppError('Blog post not found', 404)
  if (!canManagePost(req.user, post)) throw new AppError('Not allowed', 403)

  const status = req.body.status
  if (!['draft', 'published', 'scheduled'].includes(status)) {
    throw new AppError('Invalid status', 400)
  }

  post.status = status
  if (status === 'published') post.publishedAt = post.publishedAt || new Date()
  if (status === 'scheduled' && req.body.publishedAt) {
    post.publishedAt = new Date(req.body.publishedAt)
  }
  await post.save()

  res.json({ success: true, post: formatAdminPost(post, req) })
})

/** DELETE /api/admin/blog/posts/:id */
export const deleteAdminPost = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id)
  if (!post) throw new AppError('Blog post not found', 404)
  if (!canManagePost(req.user, post)) throw new AppError('Not allowed to delete this post', 403)

  await post.deleteOne()
  res.json({ success: true, message: 'Blog post deleted' })
})

/** POST /api/admin/blog/posts/bulk-delete */
export const bulkDeleteAdminPosts = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : []
  if (!ids.length) throw new AppError('No posts selected', 400)

  const posts = await Blog.find({ _id: { $in: ids } })
  const allowed = posts.filter((p) => canManagePost(req.user, p)).map((p) => p._id)

  const result = await Blog.deleteMany({ _id: { $in: allowed } })
  res.json({
    success: true,
    deleted: result.deletedCount,
    message: `${result.deletedCount} post(s) deleted`,
  })
})

/** GET /api/admin/blog/analytics */
export const getBlogAnalytics = asyncHandler(async (req, res) => {
  const filter = req.user.role === ROLES.MANAGER ? { authorId: req.user._id } : {}

  const [total, published, drafts, scheduled, viewsAgg, topPosts] = await Promise.all([
    Blog.countDocuments(filter),
    Blog.countDocuments({ ...filter, status: 'published' }),
    Blog.countDocuments({ ...filter, status: 'draft' }),
    Blog.countDocuments({ ...filter, status: 'scheduled' }),
    Blog.aggregate([
      { $match: filter },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
    ]),
    Blog.find(filter).sort({ viewCount: -1 }).limit(5).lean(),
  ])

  res.json({
    success: true,
    analytics: {
      total,
      published,
      drafts,
      scheduled,
      totalViews: viewsAgg[0]?.totalViews ?? 0,
      topPosts: topPosts.map((p) => ({
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount ?? 0,
        status: p.status,
      })),
    },
  })
})

function formatCategory(cat, req) {
  const c = cat.toObject ? cat.toObject() : cat
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description,
    color: c.color,
    icon: c.icon,
    image: c.image ? resolveBlogImage(c.image, req) : null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

/** GET /api/admin/blog/categories */
export const listBlogCategories = asyncHandler(async (req, res) => {
  const categories = await BlogCategory.find().sort({ name: 1 })
  res.json({ success: true, categories: categories.map((c) => formatCategory(c, req)) })
})

/** POST /api/admin/blog/categories */
export const createBlogCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  if (!name) throw new AppError('Category name is required', 400)

  const slug = slugify(String(req.body.slug || name))
  const exists = await BlogCategory.findOne({ $or: [{ name }, { slug }] })
  if (exists) throw new AppError('Category already exists', 409)

  const data = {
    name,
    slug,
    description: String(req.body.description || '').trim(),
    color: String(req.body.color || '#0F6E56').trim(),
    icon: String(req.body.icon || '').trim(),
  }

  if (req.file?.filename) data.image = req.file.filename
  else if (req.body.image) data.image = req.body.image

  const category = await BlogCategory.create(data)
  res.status(201).json({ success: true, category: formatCategory(category, req) })
})

/** PUT /api/admin/blog/categories/:id */
export const updateBlogCategory = asyncHandler(async (req, res) => {
  const category = await BlogCategory.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  if (req.body.name) category.name = String(req.body.name).trim()
  if (req.body.slug) category.slug = slugify(req.body.slug)
  if (req.body.description !== undefined) category.description = String(req.body.description).trim()
  if (req.body.color) category.color = String(req.body.color).trim()
  if (req.body.icon !== undefined) category.icon = String(req.body.icon).trim()

  if (req.file?.filename) category.image = req.file.filename
  else if (req.body.removeImage === 'true') category.image = ''

  await category.save()
  res.json({ success: true, category: formatCategory(category, req) })
})

/** DELETE /api/admin/blog/categories/:id */
export const deleteBlogCategory = asyncHandler(async (req, res) => {
  const category = await BlogCategory.findById(req.params.id)
  if (!category) throw new AppError('Category not found', 404)

  const inUse = await Blog.countDocuments({ category: category.name })
  if (inUse > 0) {
    throw new AppError(`Cannot delete — ${inUse} post(s) use this category`, 400)
  }

  await category.deleteOne()
  res.json({ success: true, message: 'Category deleted' })
})
