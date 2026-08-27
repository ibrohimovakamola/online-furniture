import { useState } from 'react'
import toast from 'react-hot-toast'
import AdminImageDropzone from '../../component/AdminImageDropzone'
import { adminApi } from '../../services/adminApi'
import { PAGE_STATUSES, PAGE_TEMPLATES, getSeoChecks, publicPageUrl } from './pageEditorUtils'

async function uploadImageFile(file) {
  const fd = new FormData()
  fd.append('image', file)
  fd.append('title', 'CMS featured image')
  fd.append('category', 'living-room')
  fd.append('active', 'false')
  const { data } = await adminApi.gallery.upload(fd)
  const item = data.item || data.data?.item || data.galleryItem
  const url = item?.image?.url || item?.url || item?.imageUrl
  if (!url) throw new Error('Upload succeeded but no image URL returned')
  return url
}

export default function PagePublishing({
  status,
  template,
  slug,
  featuredImage,
  form,
  onStatusChange,
  onTemplateChange,
  onFeaturedChange,
  onSaveDraft,
  onPublish,
  saving,
  canPublish,
}) {
  const [uploading, setUploading] = useState(false)
  const checks = getSeoChecks(form)
  const score = Math.round((checks.filter((c) => c.ok).length / Math.max(checks.length, 1)) * 100)

  const handleFeatured = async (file) => {
    if (!file) {
      onFeaturedChange('')
      return
    }
    if (typeof file === 'string') {
      onFeaturedChange(file)
      return
    }
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      onFeaturedChange(url)
      toast.success('Featured image uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <aside className="cms-page-editor__sidebar space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="admin-card space-y-4 p-5">
        <h2 className="text-base font-semibold text-[var(--admin-text)]">Publishing</h2>

        <label className="admin-field">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Page status"
          >
            {PAGE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="admin-btn admin-btn--outline w-full"
            disabled={saving}
            onClick={onSaveDraft}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary w-full"
            disabled={saving || !canPublish}
            onClick={onPublish}
          >
            {status === 'published' ? 'Update & Publish' : 'Publish'}
          </button>
        </div>

        <p className="text-xs text-[var(--admin-text-subtle)]">
          Draft and archived pages are not publicly visible. Published pages appear on the
          storefront when a route exists for the slug.
        </p>
      </section>

      <section className="admin-card space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--admin-text)]">URL / Slug</h2>
        <p className="break-all font-mono text-xs text-[var(--admin-accent)]">
          {publicPageUrl(slug || 'your-slug')}
        </p>
      </section>

      <section className="admin-card space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--admin-text)]">Featured Image</h2>
        <AdminImageDropzone
          label={uploading ? 'Uploading…' : 'Upload image'}
          hint="Wide image recommended · stored via Gallery"
          value={featuredImage || null}
          onChange={handleFeatured}
        />
        {featuredImage ? (
          <button
            type="button"
            className="admin-btn admin-btn--ghost text-xs"
            onClick={() => onFeaturedChange('')}
          >
            Remove image
          </button>
        ) : null}
      </section>

      <section className="admin-card space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--admin-text)]">Page Template</h2>
        <label className="admin-field">
          <span className="sr-only">Template</span>
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            aria-label="Page template"
          >
            {PAGE_TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[var(--admin-text-subtle)]">
          Legal Page matches Privacy / Terms layout. Other templates are stored for future
          storefront themes.
        </p>
      </section>

      <section className="admin-card space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--admin-text)]">SEO Score</h2>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-[var(--admin-accent)]">{score}</span>
          <span className="pb-1 text-sm text-[var(--admin-text-muted)]">/ 100</span>
        </div>
        <ul className="space-y-1 text-xs text-[var(--admin-text-muted)]" aria-label="SEO checklist">
          {checks.slice(0, 6).map((c) => (
            <li key={c.label}>
              {c.ok ? '✓' : '⚠'} {c.label}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
