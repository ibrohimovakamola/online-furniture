import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Images, Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import GalleryItemModal from '../component/GalleryItemModal'
import adminApi from '../services/adminApi'
import { GALLERY_CATEGORY_LABELS } from '../../gallery/constants'

function toGalleryFormData(payload, imageFile) {
  const form = new FormData()
  form.append('title', payload.title.trim())
  form.append('description', (payload.description || '').trim())
  form.append('category', payload.category)
  if (payload.alt?.trim()) form.append('alt', payload.alt.trim())
  if (payload.order !== '' && payload.order != null) form.append('order', String(payload.order))
  form.append('active', payload.active ? 'true' : 'false')
  if (imageFile instanceof File) form.append('image', imageFile, imageFile.name)
  return form
}

export default function GalleryManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.gallery.list()
      setItems(res.data?.items || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load gallery')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setModalOpen(true)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      await adminApi.gallery.remove(item.id)
      toast.success('Gallery item removed')
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleSubmit = async (payload) => {
    setSaving(true)
    try {
      if (payload.id) {
        await adminApi.gallery.update(payload.id, {
          title: payload.title.trim(),
          description: (payload.description || '').trim(),
          category: payload.category,
          alt: payload.alt?.trim() || payload.title.trim(),
          order: payload.order !== '' ? Number(payload.order) : undefined,
          active: payload.active,
        })
        if (payload.imageFile instanceof File) {
          const form = new FormData()
          if (payload.alt?.trim()) form.append('alt', payload.alt.trim())
          form.append('image', payload.imageFile, payload.imageFile.name)
          await adminApi.gallery.replaceImage(payload.id, form)
        }
        toast.success('Gallery item updated')
      } else {
        if (!(payload.imageFile instanceof File)) {
          toast.error('Image is required')
          return
        }
        const form = toGalleryFormData(payload, payload.imageFile)
        await adminApi.gallery.upload(form)
        toast.success('Image uploaded to Cloudinary')
      }
      setModalOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save gallery item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Gallery"
        subtitle="Upload interior photos to Cloudinary — metadata stored in MongoDB"
      >
        <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add image
        </button>
      </AdminPageHeader>

      <div className="admin-card overflow-hidden p-2 sm:p-4">
        {loading ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">Loading gallery…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Images className="mb-4 h-12 w-12 text-[var(--admin-text-subtle)]" strokeWidth={1.25} />
            <p className="text-[var(--admin-text-muted)]">No gallery images yet.</p>
            <p className="mt-1 text-sm text-[var(--admin-text-subtle)]">
              Configure CLOUDINARY_* in server/.env, then upload your first image.
            </p>
            <button type="button" className="admin-btn admin-btn--outline mt-4" onClick={openCreate}>
              Add your first image
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Image</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Title</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Category</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Order</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Status</th>
                  <th className="px-4 py-4 text-right text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-surface-hover)]"
                  >
                    <td className="px-4 py-4">
                      <div className="admin-image-slot h-14 w-20">
                        {item.image?.url ? (
                          <img src={item.image.url} alt={item.image.alt || item.title} />
                        ) : (
                          <span className="text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--admin-text)]">{item.title}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">
                      {GALLERY_CATEGORY_LABELS[item.category] || item.category}
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{item.order}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.active
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-gray-500/15 text-gray-600'
                        }`}
                      >
                        {item.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--icon"
                          onClick={() => handleDelete(item)}
                          title="Delete"
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

      <GalleryItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        loading={saving}
      />
    </div>
  )
}
