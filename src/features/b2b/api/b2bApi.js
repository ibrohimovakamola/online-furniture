import api from '@/features/auth/authApi'

export const b2bApi = {
  /* Auth */
  register: (formData) =>
    api.post('/auth/b2b-register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  login: (payload) => api.post('/auth/b2b-login', payload),

  verifyBusiness: (formData) =>
    api.post('/auth/verify-business', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  logout: () => api.post('/auth/logout'),

  getUserProfile: () => api.get('/auth/user-profile'),

  /* Profile (legacy + account) */
  getProfile: () => api.get('/b2b/me'),

  uploadLicense: (formData) =>
    api.patch('/b2b/me/license', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAccount: () => api.get('/b2b/account'),

  updateAccount: (payload) => api.put('/b2b/account', payload),

  updateSettings: (payload) => api.put('/b2b/account/settings', payload),

  getTeamMembers: () => api.get('/b2b/account/users'),

  addTeamMember: (payload) => api.post('/b2b/account/users', payload),

  removeTeamMember: (userId) => api.delete(`/b2b/account/users/${userId}`),

  /* Dashboard */
  getDashboard: () => api.get('/b2b/dashboard'),

  getDashboardStats: () => api.get('/b2b/dashboard/stats'),

  getRecentOrders: (params) => api.get('/b2b/dashboard/recent-orders', { params }),

  getAnalytics: () => api.get('/b2b/dashboard/analytics'),

  /* Products */
  getProducts: (params) => api.get('/b2b/products', { params }),

  getCatalog: (params) => api.get('/b2b/catalog', { params }),

  getProduct: (id) => api.get(`/b2b/products/${id}`),

  getProductPricing: (id, params) => api.get(`/b2b/products/${id}/pricing`, { params }),

  calculatePrice: (payload) => api.post('/b2b/calculate-price', payload),

  /* Favorites */
  getFavorites: () => api.get('/b2b/favorites'),

  addFavorite: (productId) => api.post(`/b2b/favorites/${productId}`),

  removeFavorite: (productId) => api.delete(`/b2b/favorites/${productId}`),

  /* Orders */
  createOrder: (payload) => api.post('/b2b/orders', payload),

  getOrders: () => api.get('/b2b/orders'),

  getOrder: (orderId) => api.get(`/b2b/orders/${orderId}`),

  updateOrder: (orderId, payload) => api.put(`/b2b/orders/${orderId}`, payload),

  cancelOrder: (orderId) => api.delete(`/b2b/orders/${orderId}`),

  reorder: (orderId) => api.post(`/b2b/orders/${orderId}/reorder`),

  /* Invoices */
  generateInvoice: (payload) => api.post('/b2b/invoices/generate', payload),

  getInvoices: () => api.get('/b2b/invoices'),

  getInvoice: (invoiceId) => api.get(`/b2b/invoices/${invoiceId}`),

  downloadInvoice: (invoiceId) =>
    api.post(`/b2b/invoices/${invoiceId}/download`, null, { responseType: 'blob' }),

  emailInvoice: (invoiceId, payload) =>
    api.post(`/b2b/invoices/${invoiceId}/email`, payload),
}

export const b2bAdminApi = {
  /* Legacy applications */
  listApplications: (params) => api.get('/admin/b2b/applications', { params }),

  updateApplication: (id, payload) => api.patch(`/admin/b2b/applications/${id}`, payload),

  /* B2B users management */
  listUsers: (params) => api.get('/admin/b2b-users', { params }),

  approveUser: (userId, payload) => api.put(`/admin/b2b-users/${userId}/approve`, payload),

  rejectUser: (userId, payload) => api.put(`/admin/b2b-users/${userId}/reject`, payload),

  getUserOrders: (userId) => api.get(`/admin/b2b-users/${userId}/orders`),

  messageUser: (userId, payload) => api.post(`/admin/b2b-users/${userId}/message`, payload),
}
