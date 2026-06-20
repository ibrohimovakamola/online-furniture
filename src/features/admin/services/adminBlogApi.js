import api from '@/features/auth/authApi'

function toBlogFormData(payload = {}, imageFile) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (key === 'keywords' && Array.isArray(value)) {
      form.append('keywords', value.join(','))
      return
    }
    form.append(key, String(value))
  })
  if (imageFile instanceof File) {
    form.append('featuredImage', imageFile, imageFile.name)
  }
  return form
}

function multipartConfig(formData) {
  return { data: formData, headers: { 'Content-Type': undefined } }
}

export const adminBlogApi = {
  listPosts(params = {}) {
    return api.get('/admin/blog/posts', { params })
  },

  getPost(id) {
    return api.get(`/admin/blog/posts/${id}`)
  },

  createPost(payload, imageFile) {
    const form = toBlogFormData(payload, imageFile)
    return api.post('/admin/blog/posts', form, multipartConfig(form))
  },

  updatePost(id, payload, imageFile) {
    const form = toBlogFormData(payload, imageFile)
    return api.put(`/admin/blog/posts/${id}`, form, multipartConfig(form))
  },

  patchStatus(id, status, publishedAt) {
    return api.patch(`/admin/blog/posts/${id}/status`, { status, publishedAt })
  },

  deletePost(id) {
    return api.delete(`/admin/blog/posts/${id}`)
  },

  bulkDelete(ids) {
    return api.post('/admin/blog/posts/bulk-delete', { ids })
  },

  getAnalytics() {
    return api.get('/admin/blog/analytics')
  },

  listCategories() {
    return api.get('/admin/blog/categories')
  },

  createCategory(payload, imageFile) {
    const form = toBlogFormData(payload, imageFile)
    return api.post('/admin/blog/categories', form, multipartConfig(form))
  },

  updateCategory(id, payload, imageFile) {
    const form = toBlogFormData(payload, imageFile)
    return api.put(`/admin/blog/categories/${id}`, form, multipartConfig(form))
  },

  deleteCategory(id) {
    return api.delete(`/admin/blog/categories/${id}`)
  },
}

export function slugifyTitle(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export function calcReadTime(html) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function calcSeoScore({ title, metaDescription, keywords, slug }) {
  let score = 0
  if (title && title.length >= 20 && title.length <= 100) score += 25
  else if (title) score += 10
  if (metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160) score += 35
  else if (metaDescription && metaDescription.length >= 50) score += 20
  if (keywords?.length) score += 20
  if (slug && slug.length >= 3) score += 20
  return Math.min(100, score)
}
