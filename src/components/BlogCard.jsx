import { Link } from 'react-router-dom'
import { ArrowRight, User } from 'lucide-react'
import BlogFeaturedImage from '../features/blog/components/BlogFeaturedImage'
import { formatBlogDate, formatReadTime } from '../services/blogApi'

export function BlogCardSkeleton() {
  return (
    <div className="blog-card" aria-hidden="true">
      <div className="blog-featured aspect-[16/10] animate-pulse bg-gray-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

export default function BlogCard({ blog, variant = 'default' }) {
  const isCompact = variant === 'compact'

  return (
    <article className="blog-card group h-full">
      <Link to={`/blog/${blog.slug}`} className="flex h-full flex-col">
        <div className="blog-card__media">
          <BlogFeaturedImage
            blog={blog}
            imgClassName="blog-featured__img blog-card__img"
            aspectRatio="16 / 10"
            showOverlay
            showBadge
            sizes={
              isCompact
                ? '(max-width: 640px) 100vw, 300px'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
            }
          />
        </div>
        <div className="blog-card__body">
          <h2
            className={`font-semibold text-kresla-dark transition-colors group-hover:text-kresla-primary ${
              isCompact ? 'line-clamp-2 text-base' : 'line-clamp-2 text-lg'
            }`}
          >
            {blog.title}
          </h2>
          {!isCompact && blog.excerpt && (
            <p className="blog-card__excerpt">{blog.excerpt}…</p>
          )}
          <div className="blog-card__meta">
            {blog.author && (
              <span className="inline-flex items-center gap-1">
                <User size={13} aria-hidden="true" />
                {blog.author}
              </span>
            )}
            <span>{formatReadTime(blog.readTime)}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={blog.createdAt}>{formatBlogDate(blog.createdAt)}</time>
          </div>
          <span className="blog-card__read-btn">
            Batafsil o‘qish
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
