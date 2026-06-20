import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import AdminImageDropzone from './AdminImageDropzone'
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from '../../gallery/constants'

const emptyForm = {
  title: '',
  description: '',
  category: 'living-room',
  alt: '',
  order: '',
  active: true,
}

export default function GalleryItemModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        category: initial.category || 'living-room',
        alt: initial.image?.alt || initial.title || '',
        order: initial.order != null ? String(initial.order) : '',
        active: initial.active !== false,
      })
      setImagePreview(initial.image?.url || '')
      setImageFile(null)
    } else {
      setForm(emptyForm)
      setImagePreview('')
      setImageFile(null)
    }
  }, [open, initial])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      id: initial?.id,
      ...form,
      imageFile,
      imagePreview,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="admin-card relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--admin-text)]">
            {isEdit ? 'Edit gallery item' : 'Add gallery image'}
          </h2>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="admin-field">
            <span>Title *</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Milano divan — mehmonxona"
            />
          </label>

          <label className="admin-field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional project notes"
            />
          </label>

          <label className="admin-field">
            <span>Category *</span>
            <select
              required
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {GALLERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {GALLERY_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Image alt text</span>
            <input
              value={form.alt}
              onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
              placeholder="Defaults to title"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="admin-field">
              <span>Sort order</span>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                placeholder="Auto"
              />
            </label>
            <label className="admin-field flex flex-col justify-end">
              <span className="mb-2">Visible on site</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active
              </label>
            </label>
          </div>

          <AdminImageDropzone
            label={isEdit ? 'Replace image (optional)' : 'Image *'}
            hint="PNG, JPG up to 8MB — uploaded to Cloudinary"
            value={imageFile || imagePreview}
            onChange={(file) => {
              setImageFile(file)
              if (file instanceof File) {
                setImagePreview(URL.createObjectURL(file))
              } else if (!file) {
                setImagePreview(isEdit ? initial?.image?.url || '' : '')
              }
            }}
            required={!isEdit}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Upload & create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
