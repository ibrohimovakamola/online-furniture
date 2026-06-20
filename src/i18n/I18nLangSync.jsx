import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/features/auth/authApi'

/** Attach current UI language to all API requests */
export default function I18nLangSync() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const id = api.interceptors.request.use((config) => {
      const lang = i18n.language?.split('-')[0] || 'uz'
      config.params = { ...config.params, lang }
      config.headers = config.headers || {}
      config.headers['Accept-Language'] = lang
      return config
    })
    return () => api.interceptors.request.eject(id)
  }, [i18n.language])

  return null
}
