import api from '@/features/auth/authApi'
import { getApiBaseUrl } from '@/config/apiBase'

/** Public storefront API (no auth required) */
export const storeApi = {
  products: (params) => api.get('/store/products', { params }),
  product: (id) => api.get(`/store/products/${id}`),
  categories: async () => {
    const url = `${getApiBaseUrl()}/categories`
    const res = await api.get('/categories')
    if (import.meta.env.DEV) {
      console.log('[store] GET', url, '→', res.data?.categories?.length ?? 0, 'categories', res.data)
    }
    return res
  },
  settings: () => api.get('/store/settings'),
  flashSale: () => api.get('/store/flash-sale'),
  checkout: (payload) => api.post('/orders/checkout', payload),
  guestCheckout: (payload) => api.post('/orders/guest', payload),
  trackOrder: (token) => api.get(`/orders/track/${encodeURIComponent(token)}`),
  installmentPlans: (total) => api.get('/orders/installment-plans', { params: { total } }),
  myOrders: () => api.get('/orders/my'),
  myOrder: (id) => api.get(`/orders/${id}`),
}

export default storeApi
