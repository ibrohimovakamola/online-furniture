import Blog from '../models/Blog.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { buildImageUrl } from '../utils/helpers.js'
import { getBlogFeaturedImageUrl } from '../config/blogImages.js'
import { pickLocalized, resolveLang } from '../utils/localize.js'

function resolveBlogImage(image, req) {
  if (!image?.trim()) return null
  if (image.startsWith('http') || image.startsWith('/')) return buildImageUrl(image, req) || image
  return buildImageUrl(image, req)
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatBlogSummary(blog, req, lang) {
  const doc = blog.toObject ? blog.toObject() : blog
  const rawImage = getBlogFeaturedImageUrl(doc)
  return {
    id: String(doc._id),
    title: pickLocalized(doc.title, lang),
    category: pickLocalized(doc.category, lang),
    image: resolveBlogImage(rawImage, req),
    featuredImage: resolveBlogImage(rawImage, req),
    readTime: doc.readTime,
    author: doc.author || 'Kresla Team',
    viewCount: doc.viewCount ?? 0,
    slug: doc.slug,
    createdAt: doc.createdAt,
    excerpt: stripHtml(pickLocalized(doc.content, lang)).slice(0, 160),
  }
}

function formatBlogDetail(blog, req, lang) {
  const doc = blog.toObject ? blog.toObject() : blog
  return {
    ...formatBlogSummary(blog, req, lang),
    content: pickLocalized(doc.content, lang),
    metaDescription: pickLocalized(doc.metaDescription, lang),
  }
}

/**
 * GET /api/blogs?page=1&limit=12&category=Trend&search=mebel&sort=newest|popular
 */
export const listBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50)
  const skip = (page - 1) * limit
  const category = String(req.query.category || '').trim()
  const search = String(req.query.search || '').trim()
  const sort = String(req.query.sort || 'newest').toLowerCase()

  const filter = {
    $or: [
      { status: 'published' },
      { status: 'scheduled', publishedAt: { $lte: new Date() } },
      { status: { $exists: false }, isPublished: true },
    ],
  }

  if (category) {
    filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  }

  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ title: pattern }, { category: pattern }, { content: pattern }]
  }

  const sortOption =
    sort === 'popular' ? { viewCount: -1, createdAt: -1 } : { createdAt: -1 }

  const lang = resolveLang(req)

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ])

  res.json({
    success: true,
    lang,
    blogs: blogs.map((b) => formatBlogSummary(b, req, lang)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  })
})

/**
 * GET /api/blogs/:slug
 */
export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    {
      slug: req.params.slug,
      $or: [
        { status: 'published' },
        { status: 'scheduled', publishedAt: { $lte: new Date() } },
        { status: { $exists: false }, isPublished: true },
      ],
    },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).lean()

  if (!blog) {
    throw new AppError('Blog post not found', 404)
  }

  const lang = resolveLang(req)

  res.json({
    success: true,
    lang,
    blog: formatBlogDetail(blog, req, lang),
  })
})
