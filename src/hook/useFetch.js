import { useEffect, useMemo, useState } from 'react'
import { getApiBaseUrl } from '@/config/apiBase'

const API_BASE = getApiBaseUrl()

function buildUrl(path, params = {}) {
  if (path === 'products' || path === 'store/products') {
    const search = new URLSearchParams()
    if (params.category) search.set('category', params.category)
    if (params.search) search.set('search', params.search)
    if (params.limit) search.set('limit', String(params.limit))
    const qs = search.toString()
    return `${API_BASE}/store/products${qs ? `?${qs}` : ''}`
  }

  if (path.startsWith('products/') || path.startsWith('store/products/')) {
    const id = path.split('/').pop()
    return `${API_BASE}/store/products/${id}`
  }

  if (path === 'categories' || path === 'store/categories') {
    return `${API_BASE}/store/categories`
  }

  return `${API_BASE}/${path}`
}

/**
 * @param {string} path - e.g. 'products', 'products/:id'
 * @param {{ category?: string, search?: string, limit?: number }} params
 */
const useFetch = (path, params = {}) => {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const paramKey = useMemo(
    () => JSON.stringify({ category: params.category || '', search: params.search || '', limit: params.limit || '' }),
    [params.category, params.search, params.limit]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(buildUrl(path, params))
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || 'Request failed')

        if (cancelled) return

        if (path === 'products' || path === 'store/products') {
          setState({ products: data.products ?? [] })
        } else if (path.startsWith('products/')) {
          setState(data.product ?? null)
        } else if (path === 'categories' || path === 'store/categories') {
          setState({ categories: data.categories ?? [] })
        } else {
          setState(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          if (path === 'products' || path === 'store/products') {
            setState({ products: [] })
          } else if (path === 'categories' || path === 'store/categories') {
            setState({ categories: [] })
          } else {
            setState(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [path, paramKey])

  return { state, loading, error }
}

export default useFetch
