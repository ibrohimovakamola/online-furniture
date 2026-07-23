import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { storeApi } from '../../api/storeApi'

const getError = (err) => err.response?.data?.message || err.message || 'Request failed'

export const fetchInstallmentPlans = createAsyncThunk(
  'orders/fetchInstallmentPlans',
  async (total, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.installmentPlans(total)
      return data.plans
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.myOrders()
      return data.orders
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const fetchMyOrder = createAsyncThunk(
  'orders/fetchMyOrder',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.myOrder(id)
      return data.order
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const submitCheckout = createAsyncThunk(
  'orders/submitCheckout',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.checkout(payload)
      return data
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

export const submitGuestCheckout = createAsyncThunk(
  'orders/submitGuestCheckout',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await storeApi.guestCheckout(payload)
      return data
    } catch (err) {
      return rejectWithValue(getError(err))
    }
  }
)

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    myOrders: [],
    currentOrder: null,
    installmentPlans: [],
    checkout: {
      paymentMethod: 'payme',
      selectedPlanMonths: 3,
      installmentGateway: null,
    },
    loading: {
      orders: false,
      order: false,
      plans: false,
      checkout: false,
    },
    error: null,
  },
  reducers: {
    setPaymentMethod(state, action) {
      state.checkout.paymentMethod = action.payload
    },
    setSelectedPlanMonths(state, action) {
      state.checkout.selectedPlanMonths = action.payload
    },
    setInstallmentGateway(state, action) {
      state.checkout.installmentGateway = action.payload
    },
    resetCheckout(state) {
      state.checkout = { paymentMethod: 'payme', selectedPlanMonths: 3, installmentGateway: null }
      state.installmentPlans = []
      state.error = null
    },
    clearCurrentOrder(state) {
      state.currentOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstallmentPlans.pending, (state) => {
        state.loading.plans = true
      })
      .addCase(fetchInstallmentPlans.fulfilled, (state, action) => {
        state.loading.plans = false
        state.installmentPlans = action.payload
      })
      .addCase(fetchInstallmentPlans.rejected, (state, action) => {
        state.loading.plans = false
        state.error = action.payload
      })

      .addCase(fetchMyOrders.pending, (state) => {
        state.loading.orders = true
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading.orders = false
        state.myOrders = action.payload
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading.orders = false
        state.error = action.payload
      })

      .addCase(fetchMyOrder.pending, (state) => {
        state.loading.order = true
      })
      .addCase(fetchMyOrder.fulfilled, (state, action) => {
        state.loading.order = false
        state.currentOrder = action.payload
      })
      .addCase(fetchMyOrder.rejected, (state, action) => {
        state.loading.order = false
        state.error = action.payload
      })

      .addCase(submitCheckout.pending, (state) => {
        state.loading.checkout = true
      })
      .addCase(submitCheckout.fulfilled, (state) => {
        state.loading.checkout = false
        state.checkout = { paymentMethod: 'payme', selectedPlanMonths: 3, installmentGateway: null }
      })
      .addCase(submitCheckout.rejected, (state, action) => {
        state.loading.checkout = false
        state.error = action.payload
      })

      .addCase(submitGuestCheckout.pending, (state) => {
        state.loading.checkout = true
      })
      .addCase(submitGuestCheckout.fulfilled, (state) => {
        state.loading.checkout = false
      })
      .addCase(submitGuestCheckout.rejected, (state, action) => {
        state.loading.checkout = false
        state.error = action.payload
      })
  },
})

export const { setPaymentMethod, setSelectedPlanMonths, setInstallmentGateway, resetCheckout, clearCurrentOrder } =
  orderSlice.actions

export const selectOrders = (state) => state.orders
export const selectCheckout = (state) => state.orders.checkout
export const selectInstallmentPlans = (state) => state.orders.installmentPlans

export default orderSlice.reducer
