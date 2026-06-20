import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { User } from 'lucide-react'
import BreadCrumbs from '../components/BreadCrumbs'
import BlogCategoryBadge from '../features/blog/components/BlogCategoryBadge'
import BlogFeaturedImage from '../features/blog/components/BlogFeaturedImage'
import BlogSidebar from '../features/blog/components/BlogSidebar'
import RelatedPosts from '../features/blog/components/RelatedPosts'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import {
  fetchBlogBySlug,
  fetchBlogs,
  formatBlogDate,
  formatReadTime,
  getPopularPosts,
  getRelatedPosts,
} from '../services/blogApi'
import NotFound from './NotFound'
import '../assets/styles/blog.scss'

function BlogDetailSkeleton() {
  return (
    <div className="blog-page py-8 md:py-12">
      <div className="container mx-auto max-w-[1360px] px-3">
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="aspect-[21/9] animate-pulse rounded-xl bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
            <div className="space-y-3 pt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="h-52 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [allBlogs, setAllBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  usePageSEO({
    title: post ? `${post.title} — Kresla` : 'Blog — Kresla',
    description: post?.excerpt || '',
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setNotFound(false)

      try {
        const [blog, listResult] = await Promise.all([
          fetchBlogBySlug(slug, { signal: controller.signal }),
          fetchBlogs({ limit: 24, signal: controller.signal }),
        ])
        setPost(blog)
        setAllBlogs(listResult.blogs)
      } catch (err) {
        if (err.name === 'AbortError') return
        if (err.message?.toLowerCase().includes('not found')) {
          setNotFound(true)
        }
        setPost(null)
        setAllBlogs([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [slug])

  const related = useMemo(
    () => (post ? getRelatedPosts(allBlogs, slug, post.category, 3) : []),
    [allBlogs, slug, post]
  )

  const popular = useMemo(() => getPopularPosts(allBlogs, 5), [allBlogs])

  if (loading) return <BlogDetailSkeleton />
  if (notFound || !post) return <NotFound />

  return (
    <div className="blog-page py-8 md:py-12">
      <div className="container mx-auto max-w-[1360px] px-3">
        <BreadCrumbs currentName={post.title} />

        <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <article>
            <BlogFeaturedImage
              blog={post}
              className="blog-detail__featured mb-6 rounded-xl"
              imgClassName="blog-featured__img blog-detail__img"
              aspectRatio="21 / 9"
              priority
              showOverlay
              showBadge
              sizes="(max-width: 1024px) 100vw, 900px"
            />

            <h1 className="text-2xl font-bold text-kresla-dark md:text-3xl lg:text-4xl">
              {post.title}
            </h1>

            <div className="mb-8 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              {post.author && (
                <span className="inline-flex items-center gap-1.5 font-medium text-kresla-dark">
                  <User size={15} aria-hidden="true" />
                  {post.author}
                </span>
              )}
              <span>{formatReadTime(post.readTime)}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={post.createdAt}>{formatBlogDate(post.createdAt)}</time>
              {post.viewCount > 0 && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{post.viewCount} marta o‘qilgan</span>
                </>
              )}
            </div>

            <div
              className="prose prose-lg max-w-none text-gray-800 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-kresla-dark [&_p]:mb-4 [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <Link
                to="/blog"
                className="text-sm font-semibold text-kresla-primary transition-colors hover:text-kresla-dark"
              >
                ← Barcha maqolalar
              </Link>
              <BlogCategoryBadge category={post.category} />
            </div>

            <RelatedPosts posts={related} />
          </article>

          <BlogSidebar popular={popular.filter((p) => p.slug !== slug)} />
        </div>
      </div>
    </div>
  )
}
