export const SUPPORTED_LANGUAGES = ['en', 'ru', 'uz']
export const DEFAULT_LANGUAGE = 'uz'
export const LANGUAGE_STORAGE_KEY = 'exclusive_lang'

export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE
}

export function setStoredLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang
}

export function pickLocalized(value, lang = DEFAULT_LANGUAGE, fallback = 'en') {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return (
      value[lang] ||
      value[fallback] ||
      value.uz ||
      value.en ||
      value.ru ||
      Object.values(value).find((v) => typeof v === 'string' && v.trim()) ||
      ''
    )
  }
  return String(value)
}
