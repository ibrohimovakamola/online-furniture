import { publicPageUrl } from './pageEditorUtils'

export default function GooglePreview({ seoTitle, title, slug, description }) {
  const displayTitle = (seoTitle || title || 'Page title').slice(0, 60)
  const url = publicPageUrl(slug || 'page-slug')
  const desc =
    description?.trim() ||
    'Meta description will appear here. Add a clear summary for search results.'

  return (
    <section className="admin-card space-y-3 p-5">
      <h2 className="text-base font-semibold text-[var(--admin-text)]">Google Preview</h2>
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] p-4">
        <p className="truncate text-lg text-[#8ab4f8]">{displayTitle}</p>
        <p className="mt-0.5 truncate text-sm text-[var(--admin-success)]">{url}</p>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--admin-text-muted)]">{desc}</p>
      </div>
    </section>
  )
}
