import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { isAdminRole } from './permissions'
import {
  getStoredToken,
  getStoredUser,
  persistAuthSession,
  clearAuthSession,
} from './authStorage'

/** Prefer API JSON message; map status codes to user-friendly auth errors. */
function getAuthErrorMessage(err, fallback) {
  const status = err?.response?.status
  const apiMessage = err?.response?.data?.message

  if (status === 503 || err?.response?.data?.code === 'DATABASE_UNAVAILABLE') {
    if (apiMessage?.toLowerCase().includes('disk') || apiMessage?.toLowerCase().includes('space')) {
      return apiMessage
    }
    return (
      apiMessage ||
      'Server database is temporarily unavailable. Wait a moment, then try again. If the problem continues, restart the backend with npm run dev.'
    )
  }

  if (status === 401) {
    return apiMessage || 'Invalid email or password'
  }

  if (status === 500) {
    if (!apiMessage || apiMessage === 'Internal Server Error') {
      return 'Backend API is not running. Open a terminal, run npm run dev, and wait for "HTTP listening on port 5000".'
    }
    return apiMessage
  }

  if (status === 502 || status === 504) {
    return 'Backend is not running. Run npm run dev in the project root.'
  }

  if (!err?.response) {
    const isTimeout =
      err?.code === 'ECONNABORTED' ||
      err?.message?.toLowerCase().includes('timeout')

    if (isTimeout) {
      return 'Request timed out. The backend is running but MongoDB is not responding — stop all terminals and run npm run dev again.'
    }

    return 'Cannot reach the server. Run npm run dev in the project root and ensure the API is on port 5000.'
  }

  if (apiMessage) return apiMessage
  if (err?.message) return err.message
  return fallback
}

const storedToken = getStoredToken()
const storedUser = getStoredUser()
const hasStoredSession = Boolean(storedToken && storedUser)

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ firstName, lastName, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register({ firstName, lastName, email, password })
      persistAuthSession({ token: data.token, user: data.user })
      return data
    } catch (err) {
      return rejectWithValue(getAuthErrorMessage(err, 'Registration failed'))
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login({ email, password })
      persistAuthSession({ token: data.token, user: data.user })
      return data
    } catch (err) {
      return rejectWithValue(getAuthErrorMessage(err, 'Login failed'))
    }
  }
)

export const rehydrateSession = createAsyncThunk(
  'auth/rehydrate',
  async (_, { rejectWithValue }) => {
    try {
      const { data: refreshData } = await authApi.refresh()
      persistAuthSession({ token: refreshData.token })
      const { data } = await authApi.getMe()
      persistAuthSession({ token: refreshData.token, user: data.user })
      return { token: refreshData.token, user: data.user }
    } catch {
      return rejectWithValue(null)
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await authApi.logout()
  } catch {
    /* clear local session even if API fails */
  }
  clearAuthSession()
})

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.getMe()
      persistAuthSession({ user: data.user })
      return data.user
    } catch (err) {
      return rejectWithValue({
        message: getAuthErrorMessage(err, 'Session expired'),
        status: err?.response?.status ?? null,
      })
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: hasStoredSession ? storedUser : null,
    token: storedToken,
    status: 'idle',
    error: null,
    initialized: !storedToken,
    bootstrapping: Boolean(storedToken),
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.error = null
      state.initialized = true
      state.bootstrapping = false
      state.status = 'idle'
      clearAuthSession()
    },
    clearAuthError(state) {
      state.error = null
    },
    bootstrapAuth(state) {
      state.initialized = true
      state.bootstrapping = false
    },
    setAuthSession(state, action) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.initialized = true
      state.bootstrapping = false
      state.status = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        state.bootstrapping = false
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        state.bootstrapping = false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(rehydrateSession.pending, (state) => {
        state.bootstrapping = true
      })
      .addCase(rehydrateSession.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        state.bootstrapping = false
        state.status = 'idle'
        state.error = null
      })
      .addCase(rehydrateSession.rejected, (state) => {
        state.initialized = true
        state.bootstrapping = false
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.error = null
        state.initialized = true
        state.bootstrapping = false
        state.status = 'idle'
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.bootstrapping = true
        state.status = 'loading'
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'idle'
        state.user = action.payload
        state.token = getStoredToken()
        state.initialized = true
        state.bootstrapping = false
        persistAuthSession({ user: action.payload, token: getStoredToken() })
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'idle'
        state.initialized = true
        state.bootstrapping = false

        const status = action.payload?.status
        const shouldClearSession = status === 401 || status === 403

        if (shouldClearSession) {
          state.user = null
          state.token = null
          clearAuthSession()
          return
        }

        // Transient API/DB errors — keep cached session so guards don't redirect-loop
        const cachedUser = getStoredUser()
        const cachedToken = getStoredToken()
        if (cachedToken && cachedUser) {
          state.user = cachedUser
          state.token = cachedToken
        }
      })
  },
})

export const { logout, clearAuthError, bootstrapAuth, setAuthSession } = authSlice.actions

export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.token
export const selectIsAdmin = (state) => isAdminRole(state.auth.user?.role)
export const selectIsAuthReady = (state) =>
  state.auth.initialized && !state.auth.bootstrapping

export default authSlice.reducer
