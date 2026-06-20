import { useTranslation } from 'react-i18next'
import { pickLocalized } from '@/i18n/pickLocalized'

/** Resolve API field that may be a string or { en, ru, uz } for current UI language */
export default function useLocalizedField() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'uz'

  return (value, fallbackLang = 'en') => pickLocalized(value, lang, fallbackLang)
}
