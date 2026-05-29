import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '@/config/apiBase'
import { fetchCategories, selectAdmin } from '../store/adminSlice'
import { buildColorsPayload, normalizeHexColor } from '../utils/colorUtils'

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  basePrice: '',
  discountedPrice: '',
  category: '',
  stock: '',
  color: '#0b3c3c',
  material: '',
  productType: '',
}

function ProductFormModal({ open, onClose, onSubmit, categories: categoriesProp, initialData, loading }) {
  const dispatch = useDispatch()
  const { categories: categoriesFromStore, loading: storeLoading } = useSelector(selectAdmin)
  const categoriesLoading = storeLoading?.categories

  const categories = useMemo(() => {
    const fromStore = Array.isArray(categoriesFromStore) ? categoriesFromStore : []
    const fromProp = Array.isArray(categoriesProp) ? categoriesProp : []
    return fromStore.length >= fromProp.length ? fromStore : fromProp
  }, [categoriesFromStore, categoriesProp])

  const [form, setForm] = useState(emptyForm)
  const [mainImage, setMainImage] = useState(null)
  const [mainPreview, setMainPreview] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const mainInputRef = useRef(null)

  const isEdit = Boolean(initialData)

  useEffect(() => {
    if (!open) return
    const url = `${getApiBaseUrl()}/admin/categories`
    if (import.meta.env.DEV) console.log('[ProductFormModal] fetching categories:', url)

    dispatch(fetchCategories('')).then((result) => {
      if (fetchCategories.fulfilled.match(result)) {
        if (import.meta.env.DEV) {
          console.log('[ProductFormModal] categories response:', result.payload)
        }
      } else if (fetchCategories.rejected.match(result)) {
        console.error('[ProductFormModal] categories failed:', result.payload)
        toast.error(result.payload || 'Could not load categories')
      }
    })
  }, [open, dispatch])

  useEffect(() => {
    if (!open) return
    if (import.meta.env.DEV) {
      console.log('[ProductFormModal] categories state:', {
        count: categories?.length ?? 0,
        loading: categoriesLoading,
        categories,
      })
    }
  }, [open, categories, categoriesLoading])

  useEffect(() => {
    if (!open) return

    if (initialData) {
      setForm({
        name: initialData.name || '',
        sku: initialData.sku || '',
        description: initialData.description || '',
        basePrice: initialData.basePrice ?? '',
        discountedPrice: initialData.discountedPrice ?? '',
        category: String(
          initialData.category?.id ||
            initialData.category?._id ||
            initialData.category ||
            ''
        ),
        stock: initialData.stock ?? '',
        color: initialData.filters?.color || initialData.colors?.[0] || '#0b3c3c',
        material: initialData.filters?.material || '',
        productType: initialData.filters?.productType || initialData.filters?.type || '',
      })
      const main = initialData.images?.find((i) => i.type === 'main')
      setMainPreview(main?.url || null)
      setGalleryPreviews(
        (initialData.images || []).filter((i) => i.type === 'gallery').map((i) => i.url)
      )
    } else {
      setForm(emptyForm)
      setMainPreview(null)
      setGalleryPreviews([])
    }

    setMainImage(null)
    setGalleryImages([])
  }, [open, initialData])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'color') {
      setForm((prev) => ({ ...prev, color: value }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleColorPicker = (value) => {
    setForm((prev) => ({ ...prev, color: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const hasExistingMain = isEdit && initialData?.images?.some((i) => i.type === 'main')
    if (!isEdit && !(mainImage instanceof File)) {
      toast.error('Please upload a main product image')
      return
    }
    if (isEdit && !(mainImage instanceof File) && !hasExistingMain) {
      toast.error('Please upload a main product image')
      return
    }

    let existingImages
    if (isEdit && initialData?.images) {
      existingImages = JSON.stringify(
        initialData.images
          .map((img) => ({
            url: img.url?.includes('/uploads/')
              ? img.url.split('/uploads/').pop()
              : img.url,
            type: img.type,
            sortOrder: img.sortOrder || 0,
            label: img.label || '',
          }))
          .filter((img) => !(img.type === 'main' && mainImage))
      )
    }

    const colors = buildColorsPayload(form.color)
    if (form.color.trim() && colors.length === 0) {
      toast.error('Enter a valid hex color (e.g. #65d7d7)')
      return
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description,
      basePrice: form.basePrice,
      discountedPrice: form.discountedPrice,
      category: form.category,
      stock: form.stock,
      colors,
      material: form.material,
      productType: form.productType,
      ...(existingImages ? { existingImages } : {}),
    }

    onSubmit({
      payload,
      files: { mainImage, galleryImages },
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="admin-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--admin-text)]">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Title *</span>
              <input name="name" value={form.name} onChange={handleChange} required className="admin-input !pl-3 mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">SKU</span>
              <input name="sku" value={form.sku} onChange={handleChange} className="admin-input !pl-3 mt-1" />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-[var(--admin-text-muted)]">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="admin-input !pl-3 mt-1 resize-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Price *</span>
              <input name="basePrice" type="number" min="0" step="0.01" value={form.basePrice} onChange={handleChange} required className="admin-input !pl-3 mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Discount Price</span>
              <input name="discountedPrice" type="number" min="0" step="0.01" value={form.discountedPrice} onChange={handleChange} className="admin-input !pl-3 mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Stock *</span>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="admin-input !pl-3 mt-1" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Category *</span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={categoriesLoading}
                className="admin-input !pl-3 mt-1"
              >
                <option value="">
                  {categoriesLoading
                    ? 'Loading categories…'
                    : (categories?.length ?? 0) === 0
                      ? 'No categories — create one in Categories'
                      : 'Select category'}
                </option>
                {categories?.map((cat) => {
                  const id = cat?.id ?? cat?._id
                  if (!id) return null
                  return (
                    <option key={String(id)} value={String(id)}>
                      {cat.name}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Color (hex)</span>
              <div className="flex gap-2 mt-1 items-center">
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="admin-input !pl-3 flex-1"
                  placeholder="#65d7d7"
                  pattern="^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
                />
                <input
                  type="color"
                  value={normalizeHexColor(form.color) || '#0b3c3c'}
                  onChange={(e) => handleColorPicker(e.target.value)}
                  className="h-[42px] w-12 shrink-0 rounded-lg border border-[var(--admin-border)] cursor-pointer"
                  aria-label="Pick color"
                />
                <span
                  className="h-[42px] w-[42px] shrink-0 rounded-lg border border-[var(--admin-border)] ring-1 ring-white/10"
                  style={{ background: normalizeHexColor(form.color) || 'transparent' }}
                  title={normalizeHexColor(form.color) || 'Invalid color'}
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Material</span>
              <input name="material" value={form.material} onChange={handleChange} className="admin-input !pl-3 mt-1" placeholder="e.g. Velvet" />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Type</span>
              <input name="productType" value={form.productType} onChange={handleChange} className="admin-input !pl-3 mt-1" placeholder="e.g. Sectional" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Main Image {!isEdit && '*'}</span>
              <div className="mt-1">
                {mainPreview && (
                  <div className="admin-image-slot h-28 mb-2">
                    <img src={mainPreview} alt="Main preview" />
                  </div>
                )}
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setMainImage(file)
                    setMainPreview(URL.createObjectURL(file))
                  }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => mainInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Main
                </button>
              </div>
            </div>

            <div className="block text-sm">
              <span className="text-[var(--admin-text-muted)]">Gallery Images</span>
              <div className="mt-1">
                {galleryPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {galleryPreviews.map((src, i) => (
                      <div key={i} className="admin-image-slot h-16 w-16">
                        <img src={src} alt={`Gallery ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                <label className="admin-btn admin-btn--outline cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Add Gallery
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setGalleryImages(files)
                      setGalleryPreviews((prev) => [
                        ...prev,
                        ...files.map((f) => URL.createObjectURL(f)),
                      ])
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--admin-border)]">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductFormModal
