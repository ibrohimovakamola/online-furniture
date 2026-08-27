import { useState } from 'react'
import toast from 'react-hot-toast'
import AdminImageDropzone from '../../component/AdminImageDropzone'
import { adminApi } from '../../services/adminApi'

async function uploadImageFile(file, title = 'OG image') {
  const fd = new FormData()
  fd.append('image', file)
  fd.append('title', title)
  fd.append('category', 'living-room')
  fd.append('active', 'false')
  const { data } = await adminApi.gallery.upload(fd)
  const item = data.item || data.data?.item || data.galleryItem
  const url = item?.image?.url || item?.url || item?.imageUrl
  if (!url) throw new Error('Upload succeeded but no image URL returned')
  return url
}

export default function PageMedia({ ogTitle, ogDescription, ogImage, onChange }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file) => {
    if (!file) {
      onChange('ogImage', '')
      return
    }
    if (typeof file === 'string') {
      onChange('ogImage', file)
      return
    }
    setUploading(true)
    try {
      const url = await uploadImageFile(file)
      onChange('ogImage', url)
      toast.success('OG image uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="admin-card space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--admin-text)]">Social / Open Graph</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Optional sharing preview (1200 × 630 recommended)
        </p>
      </div>
      <label className="admin-field">
        <span>OG Title</span>
        <input
          value={ogTitle}
          onChange={(e) => onChange('ogTitle', e.target.value)}
          placeholder="Same as SEO title if empty"
        />
      </label>
      <label className="admin-field">
        <span>OG Description</span>
        <textarea
          rows={2}
          value={ogDescription}
          onChange={(e) => onChange('ogDescription', e.target.value)}
        />
      </label>
      <AdminImageDropzone
        label={uploading ? 'Uploading…' : 'OG Image'}
        hint="1200 × 630 recommended · Gallery storage"
        value={ogImage || null}
        onChange={handleFile}
      />
      {ogImage ? (
        <button
          type="button"
          className="admin-btn admin-btn--ghost text-xs"
          onClick={() => onChange('ogImage', '')}
        >
          Remove OG image
        </button>
      ) : null}
    </section>
  )
}
