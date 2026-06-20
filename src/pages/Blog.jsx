import { useCallback, useEffect, useMemo, useState } from 'react'
import BreadCrumbs from '../components/BreadCrumbs'
import BlogCard, { BlogCardSkeleton } from '../components/BlogCard'
import BlogHero from '../features/blog/components/BlogHero'
import BlogFilters from '../features/blog/components/BlogFilters'
import BlogSidebar from '../features/blog/components/BlogSidebar'
import { BLOG_PAGE_SIZE } from '../features/blog/constants'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import useDebouncedValue from '../hook/useDebouncedValue'
import {
  fetchBlogs,
  filterBlogsClientSide,
  getPopularPosts,
} from '../services/blogApi'
import '../assets/styles/blog.scss'

export default function Blog() {
  const [blogs, setBlogs] = useState([])
  const [popularSource, setPopularSource] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')

  const debouncedSearch = useDebouncedValue(search, 350)

  usePageSEO({
    title: 'Blog — Kresla mebel',
    description:
      'Interyer dizayn maslahatlari, mebel trendlari va qo‘llanmalar — Kresla blogi.',
  })

  const loadBlogs = useCallback(
    async (page = 1, append = false, signal) => {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      setError(null)

      try {
        const result = await fetchBlogs({
          page,
          limit: BLOG_PAGE_SIZE,
          category: category || undefined,
          search: debouncedSearch || undefined,
          sort,
          signal,
        })

        setBlogs((prev) => (append ? [...prev, ...result.blogs] : result.blogs))
        setPagination(result.pagination)
      } catch (err) {
        if (err.name === 'AbortError') return

        if (page === 1) {
          try {
            const fallback = await fetchBlogs({ limit: 50, signal })
            const filtered = filterBlogsClientSide(fallback.blogs, {
              search: debouncedSearch,
              category,
              sort,
            })
            setBlogs(filtered.slice(0, BLOG_PAGE_SIZE))
            setPagination({
              page: 1,
              pages: Math.ceil(filtered.length / BLOG_PAGE_SIZE) || 1,
              total: filtered.length,
              limit: BLOG_PAGE_SIZE,
            })
          } catch {
            setError(err.message || 'Blog postlarini yuklab bo‘lmadi')
            setBlogs([])
          }
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [category, debouncedSearch, sort]
  )

  useEffect(() => {
    const controller = new AbortController()
    loadBlogs(1, false, controller.signal)
    return () => controller.abort()
  }, [loadBlogs])

  useEffect(() => {
    const controller = new AbortController()

    async function loadPopular() {
      try {
        const result = await fetchBlogs({ limit: 24, sort: 'popular', signal: controller.signal })
        setPopularSource(result.blogs)
      } catch {
        /* sidebar optional */
      }
    }

    loadPopular()
    return () => controller.abort()
  }, [])

  const featured = useMemo(() => {
    if (category || debouncedSearch) return null
    return blogs[0] || popularSource[0] || null
  }, [blogs, popularSource, category, debouncedSearch])

  const gridPosts = useMemo(() => {
    if (!featured || category || debouncedSearch) return blogs
    return blogs.filter((p) => p.slug !== featured.slug)
  }, [blogs, featured, category, debouncedSearch])

  const popular = useMemo(
    () => getPopularPosts(popularSource.length ? popularSource : blogs, 5),
    [popularSource, blogs]
  )

  const hasMore = pagination.page < pagination.pages

  function handleLoadMore() {
    if (!hasMore || loadingMore) return
    loadBlogs(pagination.page + 1, true)
  }

  return (
    <div className="blog-page py-8 md:py-12">
      <div className="container mx-auto max-w-[1360px] px-3">
        <BreadCrumbs currentName="Blog" />

        <header className="mb-6 mt-4 md:mb-8">
          <h1 className="text-3xl font-bold text-kresla-dark md:text-4xl">
            Interyer dizayn blogi
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Mebel tanlash, zamonaviy trendlar va uyingiz uchun amaliy maslahatlar.
          </p>
        </header>

        {!loading && featured && <BlogHero post={featured} />}

        <BlogFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          total={pagination.total}
        />

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
          <div>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: BLOG_PAGE_SIZE }).map((_, i) => (
                  <BlogCardSkeleton key={i} />
                ))}
              </div>
            ) : gridPosts.length === 0 ? (
              <div className="blog-empty">
                <p className="font-medium text-kresla-dark">Maqolalar topilmadi</p>
                <p className="mt-2 text-sm">
                  Boshqa kalit so‘z yoki kategoriyani sinab ko‘ring.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2"
                  role="feed"
                  aria-busy={loadingMore}
                >
                  {gridPosts.map((post) => (
                    <BlogCard key={post.id || post.slug} blog={post} />
                  ))}
                </div>

                {hasMore && (
                  <div className="blog-load-more">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      aria-busy={loadingMore}
                    >
                      {loadingMore ? 'Yuklanmoqda…' : 'Ko‘proq yuklash'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <BlogSidebar popular={popular} activeCategory={category} />
        </div>
      </div>
    </div>
  )
}
