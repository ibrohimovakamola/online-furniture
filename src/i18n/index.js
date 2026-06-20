import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { buildI18nResources, I18N_NAMESPACES } from './buildResources'
import { getStoredLanguage, setStoredLanguage, DEFAULT_LANGUAGE } from './pickLocalized'

const resources = buildI18nResources()

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'uz'],
    ns: I18N_NAMESPACES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    react: { useSuspense: false },
  })

  setStoredLanguage(i18n.language || DEFAULT_LANGUAGE)

  i18n.on('languageChanged', (lng) => {
    setStoredLanguage(lng)
  })
}

export default i18n
