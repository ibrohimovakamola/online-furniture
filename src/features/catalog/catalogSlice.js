import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { storeApi } from '../../api/storeApi'

export const fetchStoreCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.categories()
      return Array.isArray(data.categories) ? data.categories : []
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to load categories'
      )
    }
  }
)

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: [],
    loading: false,
    error: null,
    lastFetchedAt: null,
  },
  reducers: {
    clearCatalogError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStoreCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
        state.lastFetchedAt = Date.now()
      })
      .addCase(fetchStoreCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.categories = []
      })
  },
})

export const { clearCatalogError } = catalogSlice.actions

export const selectCatalog = (state) => state.catalog

/** Live categories from MongoDB only (no hardcoded fallback) */
export const selectStoreCategories = (state) => state.catalog.categories ?? []

export const selectCategoryById = (id) => (state) => {
  if (!id) return null
  return state.catalog.categories.find((c) => String(c.id) === String(id)) ?? null
}

export default catalogSlice.reducer
