import api from '@/features/auth/authApi'

export const faqApi = {
  list: (category) =>
    api.get('/faq', { params: category ? { category } : undefined }),
  get: (id) => api.get(`/faq/${id}`),
}

export default faqApi
