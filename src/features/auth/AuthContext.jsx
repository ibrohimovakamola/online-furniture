import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from './authApi'
import { isAdminRole } from './permissions'
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  persistAuthSession,
} from './authStorage'
import * as authService from '../../services/authService'

const AuthContext = createContext(null)

let sessionClearHandler = null

export function registerAuthSessionClear(handler) {
  sessionClearHandler = handler
}

export function triggerAuthSessionClear() {
  sessionClearHandler?.()
}

export function AuthProvider({ children }) {
  const savedToken = getStoredToken()
  const savedUser = getStoredUser()

  const [user, setUser] = useState(savedUser)
  const [token, setToken] = useState(savedToken)
  const [isLoading, setIsLoading] = useState(Boolean(savedToken))
  const [initialized, setInitialized] = useState(!savedToken)
  const [error, setError] = useState(null)

  const syncSession = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    persistAuthSession({ user: userData, token: authToken })
    setInitialized(true)
    setIsLoading(false)
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    setError(null)
    clearAuthSession()
    setInitialized(true)
    setIsLoading(false)
  }, [])

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const profile = await authService.getCurrentUser()
      const currentToken = getStoredToken() || token
      syncSession(profile, currentToken)
      return profile
    } catch (err) {
      setError(err.message || 'Failed to load profile')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [syncSession, token])

  const login = useCallback(
    async (email, password, rememberMe = false) => {
      setError(null)
      setIsLoading(true)
      try {
        const data = await authService.loginUser(email, password, rememberMe)
        syncSession(data.user, data.token)
        return data
      } catch (err) {
        setError(err.message || 'Login failed')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [syncSession]
  )

  const register = useCallback(
    async (userData) => {
      setError(null)
      setIsLoading(true)
      try {
        const data = await authService.registerUser(userData)
        if (!data.requiresVerification) {
          syncSession(data.user, data.token)
        }
        return data
      } catch (err) {
        setError(err.message || 'Registration failed')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [syncSession]
  )

  const logout = useCallback(async () => {
    setError(null)
    try {
      await authService.logoutUser()
    } catch {
      /* clear local session even if API fails */
    }
    clearSession()
  }, [clearSession])

  const verifyEmail = useCallback(async (verificationToken) => {
    setError(null)
    return authService.verifyEmailToken(verificationToken)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    setError(null)
    return authService.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(async (resetToken, password, confirmPassword) => {
    setError(null)
    return authService.resetPassword(resetToken, password, confirmPassword)
  }, [])

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      setIsLoading(true)
      let savedToken = getStoredToken()
      const cachedUser = getStoredUser()

      if (cachedUser && savedToken) {
        setUser(cachedUser)
        setToken(savedToken)
      }

      const tryRefresh = async () => {
        const { data } = await authApi.refresh()
        savedToken = data.token
        persistAuthSession({ token: savedToken })
        setToken(savedToken)
        return savedToken
      }

      if (!savedToken) {
        try {
          await tryRefresh()
        } catch {
          if (!cancelled) {
            setInitialized(true)
            setIsLoading(false)
          }
          return
        }
      }

      try {
        const { data } = await authApi.getMe()
        if (cancelled) return
        syncSession(data.user, savedToken)
      } catch (err) {
        if (cancelled) return
        const status = err?.response?.status

        if (status === 401) {
          try {
            const newToken = await tryRefresh()
            const { data } = await authApi.getMe()
            if (cancelled) return
            syncSession(data.user, newToken)
            return
          } catch {
            clearSession()
            return
          }
        }

        if (status === 403) {
          clearSession()
          return
        }

        if (cachedUser && savedToken) {
          setUser(cachedUser)
          setToken(savedToken)
          persistAuthSession({ user: cachedUser, token: savedToken })
        } else if (savedToken && !cachedUser) {
          setToken(null)
          clearAuthSession()
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setInitialized(true)
        }
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [clearSession, syncSession])

  useEffect(() => {
    registerAuthSessionClear(clearSession)
    return () => registerAuthSessionClear(null)
  }, [clearSession])

  const isAuthenticated = Boolean(user && token)
  const isAdmin = isAdminRole(user?.role)

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isLoading,
      initialized,
      isAuthenticated,
      isAdmin,
      isAuthReady: initialized && !isLoading,
      error,
      syncSession,
      clearSession,
      refreshUser,
      login,
      register,
      logout,
      verifyEmail,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      token,
      isLoading,
      initialized,
      isAuthenticated,
      isAdmin,
      error,
      syncSession,
      clearSession,
      refreshUser,
      login,
      register,
      logout,
      verifyEmail,
      forgotPassword,
      resetPassword,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export default AuthContext
