import { Link } from 'react-router-dom'
import BlogCategoryBadge, { BlogHeroThumbnail, BlogMetaLine } from './BlogCategoryBadge'

export default function BlogHero({ post }) {
  if (!post) return null

  return (
    <section className="blog-hero" aria-labelledby="blog-featured-title">
      <BlogHeroThumbnail blog={post} />
      <div className="blog-hero__content">
        <BlogCategoryBadge category={post.category} />
        <h2 id="blog-featured-title" className="blog-hero__title">
          {post.title}
        </h2>
        {post.excerpt && <p className="blog-hero__excerpt">{post.excerpt}…</p>}
        <BlogMetaLine blog={post} light />
        <Link to={`/blog/${post.slug}`} className="blog-hero__cta">
          O‘qishni davom etish
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
