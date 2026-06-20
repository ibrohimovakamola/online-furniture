import { isAdminRole } from './permissions'

/** Legacy keys (kept for backward compatibility) */
export const TOKEN_KEY = 'exclusive_token'
export const USER_KEY = 'exclusive_user'

/** Primary keys used by AuthContext */
export const AUTH_TOKEN_KEY = 'authToken'
export const AUTH_USER_KEY = 'user'
export const AUTH_ROLE_KEY = 'userRole'

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(USER_KEY)
    return safeParse(raw)
  } catch {
    return null
  }
}

export function getStoredRole() {
  try {
    const fromKey = localStorage.getItem(AUTH_ROLE_KEY)
    if (fromKey) return fromKey
    const user = getStoredUser()
    return user?.role ?? null
  } catch {
    return null
  }
}

export function isStoredAdmin() {
  const role = getStoredRole()
  if (role === 'admin') return true
  return isAdminRole(role)
}

export function persistAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(TOKEN_KEY, token)
  }

  if (user) {
    const serialized = JSON.stringify(user)
    localStorage.setItem(AUTH_USER_KEY, serialized)
    localStorage.setItem(USER_KEY, serialized)

    const role = user.role
    localStorage.setItem(AUTH_ROLE_KEY, isAdminRole(role) ? 'admin' : role)
  }
}

export function clearAuthSession() {
  for (const key of [AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_ROLE_KEY, TOKEN_KEY, USER_KEY]) {
    localStorage.removeItem(key)
  }
}
