import axios from 'axios'
import { getApiBaseUrl } from '@/config/apiBase'
import { getStoredToken, persistAuthSession, clearAuthSession } from './authStorage'
import {
  ensureCsrfToken,
  isCsrfError,
  needsCsrfForConfig,
  setCsrfHeader,
} from './csrfToken'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
})

/** Optional Redux fallback — wired in main.jsx after store is created */
let readTokenFromStore = null
let onUnauthorized = null
let onTokenRefreshed = null
let refreshPromise = null

const AUTH_SKIP_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/signup', '/auth/refresh', '/auth/b2b-login', '/auth/b2b-register']

export function attachTokenGetter(getter) {
  readTokenFromStore = getter
}

export function attachUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export function attachTokenRefreshedHandler(handler) {
  onTokenRefreshed = handler
}

function resolveToken() {
  return getStoredToken() || readTokenFromStore?.() || null
}

function setAuthHeader(config, token) {
  if (!token) return

  const value = `Bearer ${token}`

  if (config.headers?.set) {
    config.headers.set('Authorization', value)
  } else {
    config.headers = config.headers || {}
    config.headers.Authorization = value
  }
}

function stripJsonContentTypeForMultipart(config) {
  if (!(config.data instanceof FormData)) return

  if (!config.headers) config.headers = {}

  if (config.headers?.delete) {
    config.headers.delete('Content-Type')
  } else {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  config.headers['Content-Type'] = undefined
}

function shouldSkipRefreshRetry(url = '') {
  return AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path))
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use(async (config) => {
  const token = resolveToken()
  setAuthHeader(config, token)
  stripJsonContentTypeForMultipart(config)

  if (needsCsrfForConfig(config)) {
    const csrf = await ensureCsrfToken()
    setCsrfHeader(config, csrf)
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error

    if (isCsrfError(error) && config && !config._csrfRetry && needsCsrfForConfig(config)) {
      config._csrfRetry = true
      const csrf = await ensureCsrfToken({ force: true })
      setCsrfHeader(config, csrf)
      return api(config)
    }

    if (response?.status === 401 && config && !config._retry && !shouldSkipRefreshRetry(config.url)) {
      config._retry = true

      try {
        const { data } = await refreshAccessToken()
        persistAuthSession({ token: data.token })
        onTokenRefreshed?.(data.token)
        setAuthHeader(config, data.token)
        return api(config)
      } catch {
        clearAuthSession()
        onUnauthorized?.()
      }
    } else if (response?.status === 401 && shouldSkipRefreshRetry(config?.url)) {
      const hadSession = Boolean(getStoredToken())
      clearAuthSession()
      if (hadSession) onUnauthorized?.()
    }

    if (!error.response) {
      const isTimeout =
        error.code === 'ECONNABORTED' ||
        error.message?.toLowerCase().includes('timeout')

      error.message = isTimeout
        ? 'Request timed out — the API is reachable but the database may be stuck. Restart with: npm run dev'
        : 'Network error — is the backend server running on port 5000?'
    } else if (error.response.status === 404) {
      error.message = error.response.data?.message || `Route not found: ${error.config?.url}`
    } else {
      error.message = error.response.data?.message || error.message
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (payload) => api.post('/auth/register', payload),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload),
  resendVerification: (payload) => api.post('/auth/resend-verification', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  deleteAccount: (payload) => api.delete('/auth/account', { data: payload }),
}

export default api
