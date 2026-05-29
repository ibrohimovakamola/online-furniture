import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { storeApi } from '../../api/storeApi'
import api from '@/features/auth/authApi'

export const fetchStoreSettings = createAsyncThunk(
  'settings/fetchStore',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.settings()
      return data.settings
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchAdminSettings = createAsyncThunk(
  'settings/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/settings')
      return data.settings
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

function settingsFormData(payload, file) {
  const form = new FormData()
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v))
  })
  if (file instanceof File) form.append('bannerImage', file, file.name)
  return form
}

export const updateStoreSettings = createAsyncThunk(
  'settings/updateStore',
  async (store, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/admin/settings', { section: 'store', ...store })
      return data.settings
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const updateBannerSettings = createAsyncThunk(
  'settings/updateBanner',
  async ({ banner, bannerImage }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        '/admin/settings',
        settingsFormData({ section: 'banner', ...banner }, bannerImage)
      )
      return data.settings
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const updateShippingSettings = createAsyncThunk(
  'settings/updateShipping',
  async (shipping, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/admin/settings', { section: 'shipping', ...shipping })
      return data.settings
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/change-password', payload)
      return data.message
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreSettings.pending, (state) => { state.loading = true })
      .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchStoreSettings.rejected, (state) => { state.loading = false })

      .addCase(fetchAdminSettings.pending, (state) => { state.loading = true })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addMatcher(
        (action) =>
          updateStoreSettings.fulfilled.match(action) ||
          updateBannerSettings.fulfilled.match(action) ||
          updateShippingSettings.fulfilled.match(action),
        (state, action) => {
          state.saving = false
          state.data = action.payload
        }
      )
      .addMatcher(
        (action) =>
          updateStoreSettings.pending.match(action) ||
          updateBannerSettings.pending.match(action) ||
          updateShippingSettings.pending.match(action),
        (state) => { state.saving = true }
      )
      .addMatcher(
        (action) =>
          updateStoreSettings.rejected.match(action) ||
          updateBannerSettings.rejected.match(action) ||
          updateShippingSettings.rejected.match(action),
        (state, action) => {
          state.saving = false
          state.error = action.payload
        }
      )
  },
})

export const selectSettings = (state) => state.settings.data
export const selectSettingsLoading = (state) => state.settings.loading
export default settingsSlice.reducer
