import { getApiBaseUrl } from '@/config/apiBase'

const API_BASE = getApiBaseUrl()

/**
 * @param {{ category?: string; signal?: AbortSignal }} [options]
 */
export async function fetchGalleryItems(options = {}) {
  const params = new URLSearchParams()
  if (options.category) params.set('category', options.category)

  const qs = params.toString()
  const res = await fetch(`${API_BASE}/gallery${qs ? `?${qs}` : ''}`, {
    signal: options.signal,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load gallery')
  }

  return data.items || []
}
