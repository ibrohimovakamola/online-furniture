import { useEffect, useState } from 'react'
import BreadCrumbs from '../components/BreadCrumbs'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import { fetchPageBySlug } from '@/services/pagesApi'

export default function LegalPage({ slug }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return undefined
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchPageBySlug(slug, { signal: controller.signal })
      .then(setPage)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load page')
          setPage(null)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [slug])

  usePageSEO({
    title: page
      ? `${page.seoTitle || page.title} — Kresla`
      : 'Kresla',
    description: page?.description || '',
  })

  useEffect(() => {
    if (!page?.keywords?.length) return
    let meta = document.querySelector('meta[name="keywords"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'keywords')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', page.keywords.join(', '))
  }, [page])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[#6b6b6b] sm:px-6">
        Yuklanmoqda…
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-red-600">{error || 'Sahifa topilmadi'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <BreadCrumbs />
        <article className="legal-page mt-8">
          {page.featuredImage ? (
            <img
              src={page.featuredImage}
              alt=""
              className="mb-8 max-h-72 w-full rounded-xl object-cover"
            />
          ) : null}
          <header className="mb-8 border-b border-[#0b3c3c]/10 pb-6">
            <h1 className="font-[Poppins] text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
              {page.title}
            </h1>
            {page.description ? (
              <p className="mt-3 text-base text-[#6b6b6b]">{page.description}</p>
            ) : null}
          </header>
          <div
            className="legal-content space-y-4 text-base leading-relaxed text-[#333] [&_a]:text-[#0b3c3c] [&_a]:underline [&_h2]:mt-8 [&_h2]:font-[Poppins] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#1a1a1a] [&_li]:ml-5 [&_li]:list-disc [&_p]:text-[#444] [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  )
}
