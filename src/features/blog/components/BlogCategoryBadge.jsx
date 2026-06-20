import { getCategoryMeta } from '../constants'
import { formatBlogDate, formatReadTime } from '../../../services/blogApi'
import BlogFeaturedImage from './BlogFeaturedImage'

export default function BlogCategoryBadge({ category, className = '' }) {
  const meta = getCategoryMeta(category)

  return (
    <span className={`blog-badge ${meta.badgeClass} ${className}`.trim()}>{meta.label}</span>
  )
}

export function BlogHeroThumbnail({ blog }) {
  return (
    <BlogFeaturedImage
      blog={blog}
      className="blog-hero__featured"
      imgClassName="blog-featured__img blog-hero__bg"
      aspectRatio="21 / 9"
      priority
      showOverlay
      showBadge={false}
      sizes="100vw"
    />
  )
}

export function BlogMetaLine({ blog, light = false }) {
  const textClass = light ? 'text-white/80' : 'text-slate-400'

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${textClass}`}>
      {blog.author && (
        <>
          <span>{blog.author}</span>
          <span aria-hidden="true">•</span>
        </>
      )}
      <span>{formatReadTime(blog.readTime)}</span>
      <span aria-hidden="true">•</span>
      <time dateTime={blog.createdAt}>{formatBlogDate(blog.createdAt)}</time>
    </p>
  )
}
