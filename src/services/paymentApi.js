import api from '@/features/auth/authApi'

export const paymentApi = {
  gateways: () => api.get('/payments/gateways'),
  status: (orderId) => api.get(`/payments/${orderId}/status`),
  /** @deprecated use status() */
  statusLegacy: (orderId) => api.get(`/payments/status/${orderId}`),
  initiate: (payload) => api.post('/payments/initiate', payload),
  /** @deprecated use initiate() */
  init: (payload) => api.post('/payments/init', payload),
  initPayme: (payload) => api.post('/payment/payme/init', payload),
}
