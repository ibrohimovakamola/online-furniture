export const SUPPORTED_LANGS = ['en', 'ru', 'uz']
export const DEFAULT_LANG = 'uz'

/** Resolve language from query, Accept-Language, or default */
export function resolveLang(req) {
  const q = String(req.query?.lang || req.query?.locale || '')
    .toLowerCase()
    .split('-')[0]
  if (SUPPORTED_LANGS.includes(q)) return q

  const header = String(req.headers['accept-language'] || '')
  for (const part of header.split(',')) {
    const code = part.trim().split(';')[0].toLowerCase().split('-')[0]
    if (SUPPORTED_LANGS.includes(code)) return code
  }

  return DEFAULT_LANG
}

/**
 * Pick localized string from plain string or { en, ru, uz } map.
 */
export function pickLocalized(value, lang = DEFAULT_LANG, fallbackLang = 'en') {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    return (
      value[lang] ||
      value[fallbackLang] ||
      value.uz ||
      value.en ||
      value.ru ||
      Object.values(value).find((v) => typeof v === 'string' && v.trim()) ||
      ''
    )
  }
  return String(value)
}

/**
 * Pick localized value from `field_uz`, `field_ru`, `field_en` suffix columns.
 * Falls back to legacy plain `field` string.
 */
export function pickLocalizedField(doc, fieldBase, lang = DEFAULT_LANG) {
  if (!doc || typeof doc !== 'object') return ''
  const localized = doc[`${fieldBase}_${lang}`]
  if (typeof localized === 'string' && localized.trim()) return localized.trim()
  const uz = doc[`${fieldBase}_uz`]
  if (typeof uz === 'string' && uz.trim()) return uz.trim()
  const legacy = doc[fieldBase]
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim()
  return pickLocalized(legacy, lang)
}

/** Localize known product/blog fields on a plain object */
export function localizeDoc(doc, lang, fields = []) {
  if (!doc || typeof doc !== 'object') return doc
  const out = { ...doc }
  for (const key of fields) {
    if (out[key] !== undefined) out[key] = pickLocalized(out[key], lang)
  }
  return out
}
