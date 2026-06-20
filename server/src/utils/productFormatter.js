import { buildImageUrl } from '../utils/helpers.js'
import { pickLocalized, pickLocalizedField } from './localize.js'

export function resolveAssetUrl(url, req) {
  if (!url) return null
  if (url.startsWith('http')) return url
  const filename = url.replace(/^\/uploads\//, '')
  return buildImageUrl(filename, req)
}

export function formatStoreProduct(product, req, lang = 'uz') {
  const doc = product.toObject ? product.toObject() : product
  const name = pickLocalizedField(doc, 'name', lang)
  const description = pickLocalizedField(doc, 'description', lang)
  const categoryName = doc.category
    ? pickLocalizedField(doc.category, 'name', lang)
    : pickLocalizedField(doc.category?.name ?? doc.category, lang)
  const images = doc.images || []
  const mainFromImages = images.find((i) => i.type === 'main') || images[0]
  const mainUrl = resolveAssetUrl(doc.mainImage || mainFromImages?.url, req)
  const galleryUrls = [
    ...(doc.gallery || []).map((u) => resolveAssetUrl(u, req)),
    ...images.filter((i) => i.type === 'gallery').map((i) => resolveAssetUrl(i.url, req)),
  ].filter(Boolean)

  const price = doc.discountedPrice ?? doc.basePrice
  const discountPercentage =
    doc.discountedPrice && doc.basePrice
      ? Math.round((1 - doc.discountedPrice / doc.basePrice) * 100)
      : 0

  const colors = doc.colors?.length ? doc.colors : doc.filters?.color ? [doc.filters.color] : []
  const materials = doc.materials?.length
    ? doc.materials
    : doc.filters?.material
      ? [doc.filters.material]
      : []

  const dimensions = {
    width: doc.dimensions?.width ?? null,
    height: doc.dimensions?.height ?? null,
    depth: doc.dimensions?.depth ?? null,
    unit: doc.dimensions?.unit || 'cm',
  }

  return {
    id: String(doc._id),
    _id: doc._id,
    title: name,
    name,
    sku: doc.sku,
    description,
    price,
    basePrice: doc.basePrice,
    discountedPrice: doc.discountedPrice,
    discountPercentage,
    thumbnail: mainUrl,
    mainImage: mainUrl,
    images: [mainUrl, ...galleryUrls].filter(Boolean),
    gallery: galleryUrls,
    stock: doc.stock,
    colors,
    materials,
    dimensions,
    filters: {
      color: doc.filters?.color || '',
      material: doc.filters?.material || '',
      size: doc.filters?.size || '',
      productType: doc.filters?.productType || '',
    },
    category: categoryName,
    categoryId: doc.category?._id || doc.category,
    categoryName,
    isPublished: doc.isPublished,
  }
}

export function formatAdminProduct(product, req, lang = 'uz') {
  const store = formatStoreProduct(product, req, lang)
  const doc = product.toObject ? product.toObject() : product
  return {
    ...store,
    ...doc,
    id: String(doc._id),
    images: (doc.images || []).map((img) => ({
      ...img,
      url: resolveAssetUrl(img.url, req),
    })),
    category: doc.category?._id
      ? { id: doc.category._id, name: pickLocalized(doc.category.name, lang) }
      : doc.category,
  }
}
