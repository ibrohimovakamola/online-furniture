import { useState } from 'react'
import BlogCategoryBadge from './BlogCategoryBadge'
import { getBlogCoverColor, getBlogImageAlt, resolveBlogImageUrl } from '../../../services/blogApi'

/**
 * Featured image with lazy load, gradient overlay, category badge, and fallbacks.
 */
export default function BlogFeaturedImage({
  blog,
  className = '',
  imgClassName = 'blog-featured__img',
  aspectRatio = '16 / 10',
  priority = false,
  showOverlay = true,
  showBadge = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
}) {
  const primarySrc = resolveBlogImageUrl(blog, 'primary')
  const categorySrc = resolveBlogImageUrl(blog, 'category')
  const coverColor = getBlogCoverColor(blog.category, blog.slug)
  const alt = getBlogImageAlt(blog)

  const [stage, setStage] = useState('primary') // primary | category | color

  const src =
    stage === 'primary' ? primarySrc : stage === 'category' ? categorySrc : null

  function handleError() {
    if (stage === 'primary' && categorySrc && categorySrc !== primarySrc) {
      setStage('category')
      return
    }
    setStage('color')
  }

  return (
    <div
      className={`blog-featured ${className}`.trim()}
      style={{ aspectRatio, backgroundColor: coverColor }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={sizes}
          width={800}
          height={500}
          onError={handleError}
        />
      ) : (
        <div className="blog-featured__color-fallback" aria-hidden="true">
          <span className="blog-featured__color-label">{blog.category}</span>
        </div>
      )}

      {showOverlay && <div className="blog-featured__overlay" aria-hidden="true" />}

      {showBadge && blog.category && (
        <div className="blog-featured__badge">
          <BlogCategoryBadge category={blog.category} />
        </div>
      )}
    </div>
  )
}
