const SITE_ORIGIN =
  (typeof window !== 'undefined' && window.location?.origin) || 'https://mebelsotish.uz'

export const PAGE_TEMPLATES = [
  { value: 'default', label: 'Default Page' },
  { value: 'full-width', label: 'Full Width' },
  { value: 'legal', label: 'Legal Page' },
  { value: 'landing', label: 'Landing Page' },
]

export const PAGE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export const CMS_LANGS = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export const emptyLocale = () => ({
  title: '',
  content: '',
  description: '',
  seoTitle: '',
})

export const emptyPageForm = () => ({
  slug: '',
  title: '',
  content: '',
  description: '',
  seoTitle: '',
  focusKeyword: '',
  keywords: '',
  status: 'draft',
  featuredImage: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  template: 'default',
  translations: {
    uz: emptyLocale(),
    ru: emptyLocale(),
    en: emptyLocale(),
  },
})

export function slugifyTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || ''))
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasH1(html) {
  return /<h1[\s>]/i.test(String(html || ''))
}

export function publicPageUrl(slug) {
  const path = slug ? `/${slug}` : ''
  return `${SITE_ORIGIN}${path}`
}

export function pageFromApi(page) {
  const translations = {
    uz: { ...emptyLocale(), ...(page.translations?.uz || {}) },
    ru: { ...emptyLocale(), ...(page.translations?.ru || {}) },
    en: { ...emptyLocale(), ...(page.translations?.en || {}) },
  }

  if (!translations.uz.title && page.title) {
    translations.uz = {
      title: page.title || '',
      content: page.content || '',
      description: page.description || '',
      seoTitle: page.seoTitle || '',
    }
  }

  return {
    slug: page.slug || '',
    title: page.title || '',
    content: page.content || '',
    description: page.description || '',
    seoTitle: page.seoTitle || '',
    focusKeyword: page.focusKeyword || '',
    keywords: Array.isArray(page.keywords) ? page.keywords.join(', ') : page.keywords || '',
    status: page.status || (page.published ? 'published' : 'draft'),
    featuredImage: page.featuredImage || '',
    ogTitle: page.ogTitle || '',
    ogDescription: page.ogDescription || '',
    ogImage: page.ogImage || '',
    template: page.template || 'default',
    translations,
  }
}

export function buildPagePayload(form, { lang = 'uz' } = {}) {
  const locale = form.translations?.[lang] || emptyLocale()
  const title = (locale.title || form.title || '').trim()
  const content = locale.content || form.content || ''
  const description = (locale.description || form.description || '').trim()
  const seoTitle = (locale.seoTitle || form.seoTitle || '').trim()

  const keywords = String(form.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const translations = {
    uz: { ...emptyLocale(), ...(form.translations?.uz || {}) },
    ru: { ...emptyLocale(), ...(form.translations?.ru || {}) },
    en: { ...emptyLocale(), ...(form.translations?.en || {}) },
  }
  translations[lang] = {
    title,
    content,
    description,
    seoTitle,
  }

  return {
    title,
    content,
    description,
    seoTitle,
    focusKeyword: String(form.focusKeyword || '').trim(),
    keywords,
    status: form.status || 'draft',
    published: form.status === 'published',
    featuredImage: String(form.featuredImage || '').trim(),
    ogTitle: String(form.ogTitle || '').trim(),
    ogDescription: String(form.ogDescription || '').trim(),
    ogImage: String(form.ogImage || '').trim(),
    template: form.template || 'default',
    translations,
  }
}

export function validatePageForm(form, { requireContent = true } = {}) {
  const errors = {}
  const title = form.title?.trim() || form.translations?.uz?.title?.trim()
  const content = form.content || form.translations?.uz?.content || ''
  const slug = form.slug?.trim()

  if (!title || title.length < 2) errors.title = 'Title is required'
  if (!slug) errors.slug = 'Slug is required'
  else if (!isValidSlug(slug)) {
    errors.slug = 'Only lowercase letters, numbers and hyphens are allowed'
  }
  if (requireContent && stripHtml(content).length < 10) {
    errors.content = 'Content cannot be empty'
  }
  return errors
}

export function getSeoChecks(form) {
  const title = form.seoTitle || form.title
  const description = form.description
  const checks = []

  if (title) checks.push({ ok: true, label: 'SEO title exists' })
  else checks.push({ ok: false, label: 'SEO title missing', warn: true })

  if (description) checks.push({ ok: true, label: 'Meta description exists' })
  else checks.push({ ok: false, label: 'Meta description missing', warn: true })

  if (hasH1(form.content) || form.title) {
    checks.push({ ok: true, label: 'H1 / page title exists' })
  } else {
    checks.push({ ok: false, label: 'No H1 in content', warn: true })
  }

  if (isValidSlug(form.slug)) checks.push({ ok: true, label: 'Slug is valid' })
  else checks.push({ ok: false, label: 'Slug is invalid' })

  if (title && title.length > 60) {
    checks.push({ ok: false, label: 'SEO title is too long', warn: true })
  }
  if (description && description.length < 50) {
    checks.push({ ok: false, label: 'Meta description is too short', warn: true })
  }
  if (!form.focusKeyword) {
    checks.push({ ok: false, label: 'No focus keyword', warn: true })
  }

  return checks
}

export function translationStatus(translations) {
  return CMS_LANGS.map(({ code }) => {
    const loc = translations?.[code] || {}
    const complete = Boolean(loc.title?.trim() && stripHtml(loc.content).length >= 10)
    return { code, complete }
  })
}
