import { Link } from 'react-router-dom'
import { getCategoryMeta } from '../constants'
import BlogCategoryBadge from './BlogCategoryBadge'
import BlogNewsletter from './BlogNewsletter'
import BlogFeaturedImage from './BlogFeaturedImage'
import { formatReadTime } from '../../../services/blogApi'

function PopularThumb({ post }) {
  return (
    <BlogFeaturedImage
      blog={post}
      className="blog-popular-item__featured"
      imgClassName="blog-featured__img blog-popular-item__thumb"
      aspectRatio="1 / 1"
      showOverlay={false}
      showBadge={false}
      sizes="56px"
    />
  )
}

export default function BlogSidebar({ popular = [], activeCategory = '' }) {
  const activeMeta = activeCategory ? getCategoryMeta(activeCategory) : null

  return (
    <aside className="blog-sidebar" aria-label="Blog yon paneli">
      <div className="blog-sidebar__widget">
        <h3 className="blog-sidebar__title">Eng ko‘p o‘qilgan</h3>
        {popular.length === 0 ? (
          <p className="text-sm text-slate-500">Hozircha maqolalar yo‘q.</p>
        ) : (
          <ul className="space-y-0">
            {popular.map((post, index) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="blog-popular-item">
                  <span className="blog-popular-item__rank">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="blog-popular-item__title line-clamp-2">{post.title}</p>
                    <p className="blog-popular-item__meta">
                      {formatReadTime(post.readTime)}
                      {post.viewCount > 0 && ` • ${post.viewCount} ko‘rish`}
                    </p>
                  </div>
                  <PopularThumb post={post} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="blog-sidebar__widget">
        <h3 className="blog-sidebar__title">Kategoriyalar</h3>
        {activeMeta && (
          <p className="blog-category-desc">{activeMeta.description}</p>
        )}
        <ul className="flex flex-col gap-2">
          {['Maslahat', 'Trend', "Qo'llanma", 'Dizayn'].map((key) => {
            const meta = getCategoryMeta(key)
            return (
              <li key={key} className="flex items-start gap-2">
                <BlogCategoryBadge category={key} />
                <span className="text-xs leading-snug text-slate-500">{meta.description}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <BlogNewsletter />
    </aside>
  )
}
