/**
 * API base URL for Axios/fetch.
 *
 * Local dev (recommended):
 *   - Axios baseURL = `/api`
 *   - Vite proxies `/api` → http://localhost:5000 (see vite.config.js)
 *   - No CORS issues because the browser talks to the same origin (5173)
 *
 * Direct backend (optional):
 *   - Set VITE_API_BASE_URL=http://localhost:5000/api in `.env`
 *   - Requires CORS on the backend (already configured in server/src/app.js)
 */

const LOCAL_SERVER = 'http://localhost:5000'
const API_SUFFIX = '/api'

/** Full backend API root for direct calls (bypasses Vite proxy). */
export const DEV_API_ROOT = `${LOCAL_SERVER}${API_SUFFIX}`

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

  // Same-origin proxy — Vite forwards /api → http://localhost:5000/api
  if (import.meta.env.DEV) {
    return API_SUFFIX
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
