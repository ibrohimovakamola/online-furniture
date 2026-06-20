import { getApiBaseUrl } from '@/config/apiBase'

const API_BASE = getApiBaseUrl()

/**
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function fetchPageBySlug(slug, options = {}) {
  const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(slug)}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Page not found')
  }

  return data.page
}
