import { getSeoChecks } from './pageEditorUtils'

function CharCount({ value, softMax, hardMax }) {
  const len = String(value || '').length
  const overSoft = len > softMax
  return (
    <span
      className={`text-xs ${overSoft ? 'text-amber-400' : 'text-[var(--admin-text-subtle)]'}`}
    >
      {len}/{softMax}
      {hardMax && len > softMax ? ` (max ${hardMax})` : ''}
    </span>
  )
}

export default function PageSEO({
  seoTitle,
  description,
  focusKeyword,
  keywords,
  content = '',
  slug = '',
  onChange,
}) {
  const checks = getSeoChecks({
    seoTitle,
    title: seoTitle,
    description,
    focusKeyword,
    content,
    slug: slug || 'valid-slug',
  })

  return (
    <section className="admin-card space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--admin-text)]">SEO Settings</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Optional — improve how this page appears in search
        </p>
      </div>

      <label className="admin-field">
        <span>SEO Title</span>
        <input
          value={seoTitle}
          maxLength={70}
          onChange={(e) => onChange('seoTitle', e.target.value)}
          placeholder="Kresla — Modern Furniture"
        />
        <CharCount value={seoTitle} softMax={60} hardMax={70} />
      </label>

      <label className="admin-field">
        <span>Meta Description</span>
        <textarea
          rows={3}
          maxLength={200}
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Discover modern and high-quality furniture from Kresla…"
        />
        <CharCount value={description} softMax={160} hardMax={200} />
      </label>

      <label className="admin-field">
        <span>Focus Keyword</span>
        <input
          value={focusKeyword}
          onChange={(e) => onChange('focusKeyword', e.target.value)}
          placeholder="modern furniture"
        />
      </label>

      <label className="admin-field">
        <span>Keywords (comma-separated)</span>
        <input
          value={keywords}
          onChange={(e) => onChange('keywords', e.target.value)}
          placeholder="furniture, sofa, kresla"
        />
      </label>

      <ul className="space-y-1.5 text-xs" aria-label="SEO checklist">
        {checks.map((c) => (
          <li
            key={c.label}
            className={
              c.ok
                ? 'text-[var(--admin-success)]'
                : c.warn
                  ? 'text-amber-400'
                  : 'text-[var(--admin-danger)]'
            }
          >
            {c.ok ? '✓' : '⚠'} {c.label}
          </li>
        ))}
      </ul>
    </section>
  )
}
