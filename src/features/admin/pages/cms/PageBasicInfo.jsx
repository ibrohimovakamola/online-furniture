import { Check, X } from 'lucide-react'
import { publicPageUrl } from './pageEditorUtils'

export default function PageBasicInfo({
  title,
  slug,
  slugManual,
  slugStatus,
  errors,
  onTitleChange,
  onSlugChange,
  readOnlySlug = false,
}) {
  return (
    <section className="admin-card space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--admin-text)]">Page Information</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Title and URL slug for this CMS page
        </p>
      </div>

      <label className="admin-field">
        <span>
          Title <span className="text-[var(--admin-danger)]">*</span>
        </span>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="About Kresla"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'page-title-error' : undefined}
        />
        {errors.title ? (
          <span id="page-title-error" className="text-xs text-[var(--admin-danger)]">
            {errors.title}
          </span>
        ) : null}
      </label>

      <label className="admin-field">
        <span>
          Slug <span className="text-[var(--admin-danger)]">*</span>
        </span>
        <input
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="about-kresla"
          disabled={readOnlySlug}
          aria-invalid={Boolean(errors.slug)}
          aria-describedby="page-slug-hint"
        />
        <span id="page-slug-hint" className="text-xs text-[var(--admin-text-subtle)]">
          URL: {publicPageUrl(slug || 'your-slug')}
          {slugManual ? ' · manually edited' : ''}
        </span>
        {errors.slug ? (
          <span className="text-xs text-[var(--admin-danger)]">{errors.slug}</span>
        ) : null}
        {slugStatus === 'available' ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--admin-success)]">
            <Check className="h-3.5 w-3.5" aria-hidden /> Available
          </span>
        ) : null}
        {slugStatus === 'taken' ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--admin-danger)]">
            <X className="h-3.5 w-3.5" aria-hidden /> This slug is already in use
          </span>
        ) : null}
        {slugStatus === 'checking' ? (
          <span className="text-xs text-[var(--admin-text-muted)]">Checking slug…</span>
        ) : null}
      </label>
    </section>
  )
}
