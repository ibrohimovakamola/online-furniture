import { getServerOrigin } from '@/config/apiBase'

export function resolveProductImageUrl(raw) {
  if (raw == null) return null

  const value = typeof raw === 'string' ? raw.trim() : String(raw.url || raw.src || '').trim()
  if (!value) return null

  if (value.startsWith('blob:') || value.startsWith('data:')) return value

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const { pathname } = new URL(value)
      if (pathname.startsWith('/uploads/')) return pathname
    } catch {
      return value
    }
    return value
  }

  if (value.startsWith('/uploads/')) return value

  const serverOrigin = getServerOrigin()
  if (value.startsWith('/')) {
    return serverOrigin ? `${serverOrigin}${value}` : value
  }

  const filename = value.replace(/^uploads\//, '')
  return serverOrigin ? `${serverOrigin}/uploads/${filename}` : `/uploads/${filename}`
}

export function getProductImageSource(product) {
  if (!product) return null

  const images = Array.isArray(product.images) ? product.images : []
  const mainEntry = images.find((i) => i?.type === 'main') ?? images[0]

  const fromImages =
    typeof mainEntry === 'string'
      ? mainEntry
      : mainEntry?.url ?? (typeof images[0] === 'string' ? images[0] : images[0]?.url)

  const fromMain =
    typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url

  return resolveProductImageUrl(fromImages || fromMain || product.thumbnail)
}
