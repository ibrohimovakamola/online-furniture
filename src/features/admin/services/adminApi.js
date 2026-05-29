import api from '@/features/auth/authApi'
import { buildColorsPayload } from '../utils/colorUtils'

const REQUIRED_TEXT_FIELDS = new Set(['name', 'category', 'basePrice', 'stock'])

/** Keys handled explicitly — never appended in the generic loop */
const PRODUCT_FORM_SKIP_KEYS = new Set([
  'color',
  'colors',
  'material',
  'productType',
  'type',
  'filters',
])

/**
 * Build multipart body for product create/update.
 * Multer fields: mainImage, galleryImages (see server upload.js).
 */
function toProductFormData(payload = {}, files = {}) {
  const form = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (PRODUCT_FORM_SKIP_KEYS.has(key)) return
    if (value === undefined || value === null) return
    if (value === '' && !REQUIRED_TEXT_FIELDS.has(key)) return
    form.append(key, typeof value === 'string' ? value : String(value))
  })

  const colors = buildColorsPayload(payload.colors?.length ? payload.colors : payload.color)
  if (colors.length > 0) {
    form.append('colors', JSON.stringify(colors))
  }

  const filters = {
    color: colors[0] || '',
    material: String(payload.material || '').trim(),
    productType: String(payload.productType || payload.type || '').trim(),
  }

  if (filters.color || filters.material || filters.productType) {
    form.append('filters', JSON.stringify(filters))
  }

  const main = files.mainImage
  if (main instanceof File) form.append('mainImage', main, main.name)

  const gallery = files.galleryImages
  if (Array.isArray(gallery)) {
    gallery.forEach((file) => {
      if (file instanceof File) form.append('galleryImages', file, file.name)
    })
  }

  return form
}

/** Build multipart body for category create/update. Multer field: image */
function toCategoryFormData(payload = {}, imageFile) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, String(value))
  })
  if (imageFile instanceof File) form.append('image', imageFile, imageFile.name)
  return form
}

/**
 * Axios config for FormData uploads.
 * Do NOT set Content-Type: multipart/form-data manually — the client must add the boundary.
 */
function multipartRequest(formData) {
  return {
    data: formData,
    headers: {
      'Content-Type': undefined,
    },
  }
}

function withDateRange(params = {}, dateRange) {
  if (dateRange) return { ...params, dateRange }
  return params
}

export const adminApi = {
  dashboard: {
    stats: (dateRange) => api.get('/admin/dashboard/stats', { params: withDateRange({}, dateRange) }),
  },
  analytics: {
    overview: (dateRange) =>
      api.get('/admin/analytics/overview', { params: withDateRange({}, dateRange) }),
    revenue: (dateRange) =>
      api.get('/admin/analytics/revenue', { params: withDateRange({}, dateRange) }),
  },
  products: {
    list: (search = '', dateRange) =>
      api.get('/admin/products', { params: withDateRange({ search }, dateRange) }),
    get: (id) => api.get(`/admin/products/${id}`),
    create: (payload, files) => {
      const form = toProductFormData(payload, files)
      return api.post('/admin/products', form, multipartRequest(form))
    },
    update: (id, payload, files) => {
      const form = toProductFormData(payload, files)
      return api.put(`/admin/products/${id}`, form, multipartRequest(form))
    },
    remove: (id) => api.delete(`/admin/products/${id}`),
  },
  categories: {
    list: (search = '') => api.get('/admin/categories', { params: { search } }),
    create: (payload, imageFile) => {
      const form = toCategoryFormData(payload, imageFile)
      return api.post('/admin/categories', form, multipartRequest(form))
    },
    update: (id, payload, imageFile) => {
      const form = toCategoryFormData(payload, imageFile)
      return api.put(`/admin/categories/${id}`, form, multipartRequest(form))
    },
    remove: (id) => api.delete(`/admin/categories/${id}`),
  },
  orders: {
    list: (search = '', dateRange) =>
      api.get('/admin/orders', { params: withDateRange({ search }, dateRange) }),
    updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  },
  customers: {
    list: (search = '') => api.get('/admin/customers', { params: { search } }),
    toggleBlock: (id) => api.patch(`/admin/customers/${id}/toggle-block`),
    updateRole: (id, role) => api.patch(`/admin/customers/${id}/role`, { role }),
  },
  flashSale: {
    get: () => api.get('/admin/flash-sale'),
    updateConfig: (config) => api.put('/admin/flash-sale/config', config),
    updateProducts: (products) => api.put('/admin/flash-sale/products', { products }),
  },
  settings: {
    get: () => api.get('/admin/settings'),
    update: (payload, bannerFile) => {
      const form = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, String(v))
      })
      if (bannerFile instanceof File) form.append('bannerImage', bannerFile, bannerFile.name)
      return api.put('/admin/settings', form, multipartRequest(form))
    },
  },
}

export { storeApi } from '../../../api/storeApi'
export default adminApi
