import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/i18n/pickLocalized'

/**
 * Shared language selector — storefront nav and admin topbar.
 */
export default function LanguageSwitcher({ className = '', id = 'app-lang' }) {
  const { t, i18n } = useTranslation('common')

  return (
    <select
      id={id}
      className={className || 'nav-lang'}
      value={i18n.language?.split('-')[0] || 'uz'}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label={t('language')}
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <option key={code} value={code}>
          {t(`languages.${code}`)}
        </option>
      ))}
    </select>
  )
}
