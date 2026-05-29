import api from '@/features/auth/authApi'

export const contactApi = {
  submit: (payload) => api.post('/contact', payload),
}

export default contactApi
