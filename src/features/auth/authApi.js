import axios from 'axios'
import { getApiBaseUrl } from '@/config/apiBase'
import { getStoredToken, clearAuthSession } from './authStorage'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

/** Optional Redux fallback — wired in main.jsx after store is created */
let readTokenFromStore = null

export function attachTokenGetter(getter) {
  readTokenFromStore = getter
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

  // Let the browser set multipart boundary (never use a bare multipart/form-data string)
  config.headers['Content-Type'] = undefined
}

api.interceptors.request.use((config) => {
  const token = resolveToken()
  setAuthHeader(config, token)
  stripJsonContentTypeForMultipart(config)
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession()
    }

    if (!error.response) {
      error.message = 'Network error — is the backend server running on port 5000?'
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
  getMe: () => api.get('/auth/me'),
}

export default api
