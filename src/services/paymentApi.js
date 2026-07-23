import api from '@/features/auth/authApi'

export const paymentApi = {
  gateways: () => api.get('/payments/gateways'),
  status: (orderId) => api.get(`/payments/${orderId}/status`),
  /** Canonical route per mebelsotish.uz spec */
  statusV2: (orderId) => api.get(`/payment/status/${orderId}`),
  initiate: (payload) => api.post('/payments/initiate', payload),
  initiateV2: (payload) => api.post('/payment/initiate', payload),
  /** @deprecated use status() */
  statusLegacy: (orderId) => api.get(`/payments/status/${orderId}`),
  /** @deprecated use initiate() */
  init: (payload) => api.post('/payments/init', payload),
  initPayme: (payload) => api.post('/payment/payme/init', payload),
}
