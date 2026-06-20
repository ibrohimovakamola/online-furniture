import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Trash2 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import AdminImageDropzone from '../component/AdminImageDropzone'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import { adminBlogApi, slugifyTitle } from '../services/adminBlogApi'

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  color: '#0F6E56',
  icon: '',
  image: '',
}

export default function BlogCategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminBlogApi.listCategories()
      setCategories(data.categories || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !slugManual) next.slug = slugifyTitle(value)
      return next
    })
  }

  const resetForm = () => {
    setForm(EMPTY)
    setImageFile(null)
    setEditingId(null)
    setSlugManual(false)
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      color: cat.color || '#0F6E56',
      icon: cat.icon || '',
      image: cat.image || '',
    })
    setSlugManual(true)
    setImageFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setBusy(true)
    try {
      if (editingId) {
        await adminBlogApi.updateCategory(editingId, form, imageFile)
        toast.success('Category updated')
      } else {
        await adminBlogApi.createCategory(form, imageFile)
        toast.success('Category created')
      }
      resetForm()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await adminBlogApi.deleteCategory(deleteTarget.id)
      toast.success('Category deleted')
      setDeleteTarget(null)
      if (editingId === deleteTarget.id) resetForm()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader title="Blog categories" subtitle="Organize posts with labels and badge colors" />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={handleSubmit} className="admin-card p-5 space-y-4 h-fit">
          <h3 className="text-sm font-semibold">{editingId ? 'Edit category' : 'New category'}</h3>

          <div className="admin-field">
            <label htmlFor="cat-name">Name *</label>
            <input
              id="cat-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cat-slug">Slug</label>
            <input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                setField('slug', e.target.value)
              }}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cat-color">Badge color</label>
            <div className="flex gap-2 items-center">
              <input
                id="cat-color"
                type="color"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-[var(--admin-border)]"
              />
              <input
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="cat-icon">Icon (emoji or name)</label>
            <input
              id="cat-icon"
              placeholder="✨ or sparkles"
              value={form.icon}
              onChange={(e) => setField('icon', e.target.value)}
            />
          </div>

          <AdminImageDropzone
            label="Category image"
            value={imageFile || form.image}
            onChange={setImageFile}
          />

          <div className="flex gap-2 pt-2">
            <button type="submit" className="admin-btn admin-btn--primary flex-1" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-card p-4">
          {loading ? (
            <LoadingSpinner label="Loading categories…" />
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-[var(--admin-text-muted)]">No categories yet.</p>
          ) : (
            <div className="admin-table-wrap overflow-x-auto">
              <table className="admin-table w-full min-w-[480px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Description</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {cat.icon && <span>{cat.icon}</span>}
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <p className="text-xs text-[var(--admin-text-subtle)]">/{cat.slug}</p>
                      </td>
                      <td>
                        <span
                          className="inline-block h-6 w-6 rounded-full border border-black/10"
                          style={{ background: cat.color }}
                          title={cat.color}
                        />
                      </td>
                      <td className="text-sm text-[var(--admin-text-muted)] max-w-[200px] truncate">
                        {cat.description || '—'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            onClick={() => startEdit(cat)}
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon text-[var(--admin-danger)]"
                            onClick={() => setDeleteTarget(cat)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be removed. Posts using it must be reassigned first.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={busy}
      />
    </div>
  )
}
