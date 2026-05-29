/**
 * API base URL for Axios/fetch.
 *
 * - Production (Vercel): set VITE_API_BASE_URL to your backend API root, e.g.
 *   https://your-api.onrender.com/api
 * - Local dev: defaults to http://localhost:5000/api (Express on PORT=5000)
 * - Legacy: VITE_API_URL is still supported
 */

const LOCAL_SERVER = 'http://localhost:5000'
const API_SUFFIX = '/api'

function trimTrailingSlash(value) {
  return String(value || '').trim().replace(/\/$/, '')
}

function ensureApiSuffix(base) {
  const normalized = trimTrailingSlash(base)
  if (!normalized) return `${LOCAL_SERVER}${API_SUFFIX}`
  if (normalized.endsWith(API_SUFFIX)) return normalized
  return `${normalized}${API_SUFFIX}`
}

/**
 * Resolved API prefix used by Axios (includes `/api`).
 * @returns {string}
 */
export function getApiBaseUrl() {
  const fromEnv =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim()

  if (fromEnv) return ensureApiSuffix(fromEnv)

  if (import.meta.env.DEV) {
    return `${LOCAL_SERVER}${API_SUFFIX}`
  }

  return API_SUFFIX
}

/**
 * Backend origin without `/api` — for `/uploads` image URLs in production.
 * @returns {string}
 */
export function getServerOrigin() {
  const fromEnv =
    import.meta.env.VITE_SERVER_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim()

  if (fromEnv) {
    const base = trimTrailingSlash(fromEnv)
    return base.endsWith(API_SUFFIX) ? base.slice(0, -API_SUFFIX.length) : base
  }

  if (import.meta.env.DEV) return LOCAL_SERVER

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return LOCAL_SERVER
}

export const API_BASE_URL = getApiBaseUrl()
