import { useEffect, useState } from 'react'
import { X, Upload } from 'lucide-react'

function CategoryFormModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setPreview(initialData.image || null)
    } else {
      setName('')
      setDescription('')
      setPreview(null)
    }
    setImageFile(null)
  }, [open, initialData])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      payload: { name, description },
      imageFile,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="admin-card relative w-full max-w-md z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--admin-text)]">
            {initialData ? 'Edit Category' : 'Add Category'}
          </h2>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="text-[var(--admin-text-muted)]">Category Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="admin-input !pl-3 mt-1" />
          </label>

          <label className="block text-sm">
            <span className="text-[var(--admin-text-muted)]">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="admin-input !pl-3 mt-1 resize-none" />
          </label>

          <div>
            <span className="text-sm text-[var(--admin-text-muted)]">Category Image</span>
            <div className="mt-1">
              {preview && (
                <div className="admin-image-slot h-32 mb-2">
                  <img src={preview} alt="Category preview" />
                </div>
              )}
              <label className="admin-btn admin-btn--outline cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setImageFile(file)
                  setPreview(URL.createObjectURL(file))
                }} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? 'Saving…' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryFormModal
