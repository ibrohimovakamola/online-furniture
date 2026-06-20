import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminApi } from '../services/adminApi'
import { fetchCategoriesList } from '../services/categoriesApi'
import { unwrapListItems } from '../utils/listResponse.js'

const getError = (err) => err.response?.data?.message || err.message || 'Request failed'

function normalizeCategory(cat) {
  if (!cat) return null
  const id = cat.id ?? cat._id
  if (!id) return null
  return {
    ...cat,
    id: String(id),
    name: cat.name ?? 'Unnamed',
  }
}

function normalizeCategories(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizeCategory).filter(Boolean)
}

export const fetchProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (arg, { rejectWithValue }) => {
    const params = typeof arg === 'string' ? { search: arg } : arg || {}
    try {
      const { data } = await adminApi.products.list(params)
      return unwrapListItems(data, 'products')
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async ({ payload, files }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.products.create(payload, files)
      return data.product
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, payload, files }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.products.update(id, payload, files)
      return data.product
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await adminApi.products.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'admin/fetchCategories',
  async (search, { rejectWithValue }) => {
    try {
      const categories = await fetchCategoriesList(search, { useAdmin: true })
      return normalizeCategories(categories)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[admin] fetchCategories failed:', err.response?.data || err.message)
      }
      return rejectWithValue(getError(err))
    }
  }
)

export const createCategory = createAsyncThunk(
  'admin/createCategory',
  async ({ payload, imageFile }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.categories.create(payload, imageFile)
      return data.category
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const updateCategory = createAsyncThunk(
  'admin/updateCategory',
  async ({ id, payload, imageFile }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.categories.update(id, payload, imageFile)
      return data.category
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const deleteCategory = createAsyncThunk(
  'admin/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await adminApi.categories.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (search, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.orders.list(search)
      return unwrapListItems(data, 'orders')
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.orders.updateStatus(id, status)
      return data.order
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const recordInstallmentPayment = createAsyncThunk(
  'admin/recordInstallmentPayment',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.orders.recordInstallmentPayment(id, note)
      return data.order
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async (search, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.customers.list(search)
      return data.customers
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const toggleCustomerBlock = createAsyncThunk(
  'admin/toggleCustomerBlock',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.customers.toggleBlock(id)
      return data.customer
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const updateCustomerRole = createAsyncThunk(
  'admin/updateCustomerRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.customers.updateRole(id, role)
      return data.customer
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchFlashSale = createAsyncThunk(
  'admin/fetchFlashSale',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.flashSale.get()
      return { config: data.config, products: data.products }
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const saveFlashSaleConfig = createAsyncThunk(
  'admin/saveFlashSaleConfig',
  async (config, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.flashSale.updateConfig(config)
      return data.config
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const saveFlashSaleProducts = createAsyncThunk(
  'admin/saveFlashSaleProducts',
  async (products, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.flashSale.updateProducts(products)
      return { config: data.config, products: data.products }
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (dateRange, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.analytics.overview(dateRange)
      return data.data
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (dateRange, { rejectWithValue }) => {
    try {
      const { data } = await adminApi.dashboard.stats(dateRange)
      return data.data
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    products: [],
    categories: [],
    orders: [],
    customers: [],
    analytics: null,
    dashboardStats: null,
    flashSale: { config: null, products: [] },
    loading: {
      products: false,
      categories: false,
      orders: false,
      customers: false,
      analytics: false,
      dashboard: false,
      flashSale: false,
      action: false,
    },
    error: null,
  },
  reducers: {
    clearAdminError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false
        state.products = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false
        state.products = []
        state.error = action.payload
      })

      .addCase(createProduct.pending, (state) => {
        state.loading.action = true
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading.action = false
        state.products.unshift(action.payload)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })

      .addCase(updateProduct.pending, (state) => {
        state.loading.action = true
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading.action = false
        const idx = state.products.findIndex((p) => p.id === action.payload.id || p._id === action.payload.id)
        if (idx >= 0) state.products[idx] = action.payload
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })

      .addCase(deleteProduct.pending, (state) => {
        state.loading.action = true
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading.action = false
        state.products = state.products.filter(
          (p) => (p.id || p._id) !== action.payload
        )
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })

      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false
        state.categories = normalizeCategories(action.payload)
        if (import.meta.env.DEV) {
          console.log('[admin] categories loaded:', state.categories.length, state.categories)
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false
        state.error = action.payload
        state.categories = []
        if (import.meta.env.DEV) {
          console.warn('[admin] fetchCategories failed:', action.payload)
        }
      })

      .addCase(createCategory.pending, (state) => {
        state.loading.action = true
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading.action = false
        const normalized = normalizeCategory(action.payload)
        if (normalized) {
          const exists = state.categories.some((c) => c.id === normalized.id)
          if (!exists) {
            state.categories.push(normalized)
            state.categories.sort((a, b) => a.name.localeCompare(b.name))
          }
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading.action = true
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading.action = false
        const normalized = normalizeCategory(action.payload)
        if (!normalized) return
        const idx = state.categories.findIndex((c) => c.id === normalized.id)
        if (idx >= 0) state.categories[idx] = normalized
        else state.categories.push(normalized)
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading.action = true
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading.action = false
        state.categories = state.categories.filter((c) => c.id !== action.payload)
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })

      .addCase(fetchOrders.pending, (state) => {
        state.loading.orders = true
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading.orders = false
        state.orders = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading.orders = false
        state.orders = []
        state.error = action.payload
      })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })

      .addCase(recordInstallmentPayment.fulfilled, (state, action) => {
        const idx = state.orders.findIndex((o) => o.id === action.payload.id)
        if (idx >= 0) state.orders[idx] = action.payload
      })

      .addCase(fetchCustomers.pending, (state) => { state.loading.customers = true })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading.customers = false
        state.customers = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading.customers = false
        state.error = action.payload
      })
      .addCase(toggleCustomerBlock.fulfilled, (state, action) => {
        const idx = state.customers.findIndex((c) => c.id === action.payload.id)
        if (idx >= 0) {
          state.customers[idx].isActive = action.payload.isActive
          state.customers[idx].isBlocked = action.payload.isBlocked
        }
      })
      .addCase(updateCustomerRole.fulfilled, (state, action) => {
        const idx = state.customers.findIndex((c) => c.id === action.payload.id)
        if (idx >= 0) state.customers[idx] = action.payload
      })

      .addCase(fetchFlashSale.pending, (state) => { state.loading.flashSale = true })
      .addCase(fetchFlashSale.fulfilled, (state, action) => {
        state.loading.flashSale = false
        state.flashSale = action.payload
      })
      .addCase(fetchFlashSale.rejected, (state, action) => {
        state.loading.flashSale = false
        state.error = action.payload
      })
      .addCase(saveFlashSaleConfig.fulfilled, (state, action) => {
        state.flashSale.config = action.payload
        state.loading.action = false
      })
      .addCase(saveFlashSaleProducts.pending, (state) => { state.loading.action = true })
      .addCase(saveFlashSaleProducts.fulfilled, (state, action) => {
        state.loading.action = false
        state.flashSale = action.payload
      })
      .addCase(saveFlashSaleProducts.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })
      .addCase(saveFlashSaleConfig.pending, (state) => { state.loading.action = true })
      .addCase(saveFlashSaleConfig.rejected, (state, action) => {
        state.loading.action = false
        state.error = action.payload
      })

      .addCase(fetchAnalytics.pending, (state) => { state.loading.analytics = true })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false
        state.analytics = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading.analytics = false
        state.error = action.payload
      })

      .addCase(fetchDashboardStats.pending, (state) => { state.loading.dashboard = true })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false
        const payload = action.payload || {}
        state.dashboardStats = {
          products: payload.products ?? 0,
          orders: payload.orders ?? 0,
          users: payload.users ?? 0,
          revenue: payload.revenue ?? 0,
          recentOrders: payload.recentOrders ?? [],
          salesByCategory: payload.salesByCategory ?? [],
          trends: {
            products: payload.trends?.products ?? [],
            orders: payload.trends?.orders ?? [],
            revenue: payload.trends?.revenue ?? [],
            users: payload.trends?.users ?? [],
          },
        }
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false
        state.error = action.payload
        state.dashboardStats = {
          products: 0,
          orders: 0,
          users: 0,
          revenue: 0,
          recentOrders: [],
          salesByCategory: [],
          trends: { products: [], orders: [], revenue: [], users: [] },
        }
      })
  },
})

export const { clearAdminError } = adminSlice.actions
export const selectAdmin = (state) => state.admin
export const selectCategories = (state) => state.admin?.categories ?? []
export default adminSlice.reducer
