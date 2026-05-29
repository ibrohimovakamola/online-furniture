import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { isAdminRole } from './permissions'
import {
  getStoredToken,
  getStoredUser,
  persistAuthSession,
  clearAuthSession,
} from './authStorage'

const storedToken = getStoredToken()
const storedUser = getStoredUser()

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ firstName, lastName, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register({ firstName, lastName, email, password })
      persistAuthSession({ token: data.token, user: data.user })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
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
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.getMe()
      persistAuthSession({ user: data.user })
      return data.user
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedToken && storedUser ? storedUser : null,
    token: storedToken,
    status: 'idle',
    error: null,
    /** false when a stored token must be validated on boot */
    initialized: !storedToken,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.error = null
      state.initialized = true
      clearAuthSession()
    },
    clearAuthError(state) {
      state.error = null
    },
    bootstrapAuth(state) {
      state.initialized = true
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
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.token = getStoredToken()
        state.initialized = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.token = null
        state.initialized = true
        clearAuthSession()
      })
  },
})

export const { logout, clearAuthError, bootstrapAuth } = authSlice.actions

export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.token
export const selectIsAdmin = (state) => isAdminRole(state.auth.user?.role)

export default authSlice.reducer
