import { getApiBaseUrl } from '@/config/apiBase'
import { getCategoryMeta } from '@/features/blog/constants'
import { BLOG_CATEGORY_IMAGES, BLOG_SLUG_IMAGES } from '@/features/blog/blogImages'

const API_BASE = getApiBaseUrl()

/**
 * @param {{
 *   page?: number
 *   limit?: number
 *   category?: string
 *   search?: string
 *   sort?: 'newest' | 'popular'
 *   signal?: AbortSignal
 * }} [options]
 */
export async function fetchBlogs(options = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.limit) params.set('limit', String(options.limit))
  if (options.category) params.set('category', options.category)
  if (options.search) params.set('search', options.search)
  if (options.sort) params.set('sort', options.sort)

  const qs = params.toString()
  const res = await fetch(`${API_BASE}/blogs${qs ? `?${qs}` : ''}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Failed to load blogs')
  }

  return {
    blogs: data.blogs ?? [],
    pagination: data.pagination ?? { page: 1, limit: 12, total: 0, pages: 1 },
  }
}

/**
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function fetchBlogBySlug(slug, options = {}) {
  const res = await fetch(`${API_BASE}/blogs/${encodeURIComponent(slug)}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Blog post not found')
  }

  return data.blog
}

/** Pastel thumbnail fallback when no image URL is set */
export const BLOG_CATEGORY_COVER = {
  Maslahat: '#c8e6d9',
  Trend: '#d4e4f0',
  "Qo'llanma": '#f0e6d4',
  Dizayn: '#e8d4f0',
}

export function formatBlogDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatReadTime(minutes) {
  const value = Number(minutes) || 0
  return `${value} daqiqa`
}

export function getBlogCoverColor(category, slug = '') {
  const meta = getCategoryMeta(category)
  if (meta?.cover) return meta.cover
  if (BLOG_CATEGORY_COVER[category]) return BLOG_CATEGORY_COVER[category]

  const seed = String(slug || category || '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const hues = ['#c8e6d9', '#d4e4f0', '#f0e6d4', '#e8d4f0', '#dce8f0']
  return hues[seed % hues.length]
}

/** Resolve featured image: stored URL → slug default → category default */
export function resolveBlogImageUrl(blog, level = 'primary') {
  if (!blog) return ''

  const stored = String(blog.featuredImage || blog.image || '').trim()
  if (level === 'primary' && stored) return stored
  if (level === 'primary' && blog.slug && BLOG_SLUG_IMAGES[blog.slug]) {
    return BLOG_SLUG_IMAGES[blog.slug]
  }
  if (blog.category && BLOG_CATEGORY_IMAGES[blog.category]) {
    return BLOG_CATEGORY_IMAGES[blog.category]
  }
  return ''
}

export function getBlogImageAlt(blog) {
  if (!blog?.title) return 'Blog post rasmi'
  return `${blog.title} — ${blog.category || 'Kresla blog'}`
}

/** Client-side filter fallback when API params are unavailable */
export function filterBlogsClientSide(blogs, { search = '', category = '', sort = 'newest' } = {}) {
  let result = [...blogs]

  if (category) {
    result = result.filter((b) => b.category?.toLowerCase() === category.toLowerCase())
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q)
    )
  }

  result.sort((a, b) => {
    if (sort === 'popular') {
      return (b.viewCount ?? 0) - (a.viewCount ?? 0)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return result
}

export function getRelatedPosts(allBlogs, currentSlug, category, limit = 3) {
  return allBlogs
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.category === category ? 1 : 0
      const bMatch = b.category === category ? 1 : 0
      if (bMatch !== aMatch) return bMatch - aMatch
      return (b.viewCount ?? 0) - (a.viewCount ?? 0)
    })
    .slice(0, limit)
}

export function getPopularPosts(blogs, limit = 5) {
  return [...blogs]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, limit)
}
