import api from '@/features/auth/authApi'
import { getApiBaseUrl } from '@/config/apiBase'

const API_BASE = getApiBaseUrl()

/** Single source of truth — same data as GET /api/categories and GET /api/admin/categories */
export const CATEGORIES_ENDPOINTS = {
  public: `${API_BASE}/categories`,
  admin: `${API_BASE}/admin/categories`,
}

export async function fetchCategoriesList(search = '', { useAdmin = true } = {}) {
  const path = useAdmin ? '/admin/categories' : '/categories'
  const url = `${API_BASE}${path}${search ? `?search=${encodeURIComponent(search)}` : ''}`

  const { data } = await api.get(path, { params: search ? { search } : {} })
  const categories = Array.isArray(data?.categories) ? data.categories : []

  if (import.meta.env.DEV) {
    console.log(`[categoriesApi] GET ${url} → ${categories.length}`, categories)
  }

  return categories
}

export default fetchCategoriesList
