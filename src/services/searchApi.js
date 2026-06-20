import { getApiBaseUrl } from '@/config/apiBase'

const API_BASE = getApiBaseUrl()

/**
 * @param {string} query
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 */
export async function searchProducts(query, options = {}) {
  const trimmed = String(query || '').trim()
  if (!trimmed) {
    return { success: true, query: '', count: 0, products: [] }
  }

  const params = new URLSearchParams({ query: trimmed })
  if (options.limit) params.set('limit', String(options.limit))

  const res = await fetch(`${API_BASE}/products/search?${params}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Search failed')
  }

  return {
    success: true,
    query: data.query ?? data.data?.query ?? trimmed,
    count: data.count ?? data.data?.total ?? 0,
    products: data.products ?? data.data?.products ?? [],
    facets: data.data?.facets,
  }
}

/**
 * @param {string} query
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 */
export async function fetchSearchSuggestions(query, options = {}) {
  const trimmed = String(query || '').trim()
  if (!trimmed) {
    return { success: true, query: '', suggestions: [] }
  }

  const params = new URLSearchParams({ query: trimmed })
  params.set('limit', String(options.limit ?? 5))

  const res = await fetch(`${API_BASE}/products/suggestions?${params}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Suggestions failed')
  }

  return {
    success: true,
    query: data.query ?? trimmed,
    suggestions: data.suggestions ?? [],
  }
}
