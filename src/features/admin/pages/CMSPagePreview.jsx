import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { adminApi } from '../services/adminApi'
import LoadingSpinner from '../component/LoadingSpinner'

/**
 * Authenticated preview of a CMS page (including drafts).
 * Renders with storefront-like typography inside the admin shell.
 */
export default function CMSPagePreview() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await adminApi.pages.get(slug)
        if (!cancelled) setPage(data.data?.page || data.page)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load preview')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <LoadingSpinner label="Loading preview…" />

  if (error || !page) {
    return (
      <div className="admin-card p-8 text-center">
        <p className="text-[var(--admin-danger)]">{error || 'Page not found'}</p>
        <Link to="/admin/pages" className="admin-btn admin-btn--outline mt-4 inline-flex">
          Back to CMS Pages
        </Link>
      </div>
    )
  }

  const status = page.status || (page.published ? 'published' : 'draft')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/pages" className="admin-btn admin-btn--ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="rounded-full bg-[var(--admin-surface)] px-3 py-1 text-xs text-[var(--admin-text-muted)]">
            Preview · {status}
          </span>
        </div>
        <Link to={`/admin/pages/edit/${page.slug}`} className="admin-btn admin-btn--primary">
          <Pencil className="h-4 w-4" />
          Edit page
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-white text-[#1a1a1a] shadow-lg">
        <div className="border-b border-[#0b3c3c]/10 bg-[#0b3c3c] px-6 py-4 text-white">
          <p className="text-sm font-semibold tracking-wide">KRESLA</p>
          <p className="text-xs text-white/70">Storefront preview (navbar simplified)</p>
        </div>
        <article className="mx-auto max-w-3xl px-6 py-10">
          {page.featuredImage ? (
            <img
              src={page.featuredImage}
              alt=""
              className="mb-8 max-h-72 w-full rounded-xl object-cover"
            />
          ) : null}
          <h1 className="font-[Poppins] text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          {page.description ? (
            <p className="mt-3 text-base text-[#6b6b6b]">{page.description}</p>
          ) : null}
          <div
            className="legal-content mt-8 space-y-4 text-base leading-relaxed text-[#333] [&_a]:text-[#0b3c3c] [&_a]:underline [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-5 [&_li]:list-disc [&_ol]:list-decimal [&_p]:text-[#444]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
        <div className="border-t border-[#0b3c3c]/10 bg-[#f7f7f7] px-6 py-6 text-center text-xs text-[#6b6b6b]">
          © Kresla · Preview footer
        </div>
      </div>
    </div>
  )
}
