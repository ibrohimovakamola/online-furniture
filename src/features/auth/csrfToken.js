import axios from 'axios'
import { getApiBaseUrl } from '@/config/apiBase'

const CSRF_COOKIE = 'csrfToken'
const CSRF_HEADER = 'X-CSRF-Token'

export function readCsrfCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

let inflight = null

/** Fetch a CSRF token (sets cookie + returns value for the X-CSRF-Token header). */
export async function ensureCsrfToken({ force = false } = {}) {
  if (!force) {
    const fromCookie = readCsrfCookie()
    if (fromCookie) return fromCookie
  }

  if (!inflight) {
    inflight = axios
      .get(`${getApiBaseUrl()}/csrf-token`, { withCredentials: true })
      .then((res) => res.data?.data?.csrfToken || res.data?.csrfToken || readCsrfCookie())
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

export function needsCsrfForConfig(config) {
  const method = (config.method || 'get').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false
  if (String(config.url || '').includes('/csrf-token')) return false
  return config.data instanceof FormData
}

export function setCsrfHeader(config, token) {
  if (!token) return

  if (config.headers?.set) {
    config.headers.set(CSRF_HEADER, token)
  } else {
    config.headers = config.headers || {}
    config.headers[CSRF_HEADER] = token
  }
}

export function isCsrfError(error) {
  const message = error?.response?.data?.message
  return error?.response?.status === 403 && typeof message === 'string' && message.includes('CSRF')
}
