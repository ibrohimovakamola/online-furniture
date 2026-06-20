import { buildImageUrl } from './helpers.js'
import { pickLocalizedField, resolveLang } from './localize.js'

export function resolveImageUrl(raw, req) {
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const filename = raw.replace(/^\/uploads\//, '')
  return buildImageUrl(filename, req)
}

/** Format category for API responses */
export function formatCatalogCategory(category, req, lang = 'uz', { includeAllLocales = false } = {}) {
  const doc = category.toObject ? category.toObject() : category
  const image = doc.image ? resolveImageUrl(doc.image, req) : null

  const base = {
    id: String(doc._id),
    slug: doc.slug,
    image,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }

  if (includeAllLocales) {
    return {
      ...base,
      name: doc.name,
      name_uz: doc.name_uz || doc.name,
      name_ru: doc.name_ru || '',
      name_en: doc.name_en || '',
      description: doc.description || '',
      description_uz: doc.description_uz || doc.description || '',
      description_ru: doc.description_ru || '',
      description_en: doc.description_en || '',
    }
  }

  return {
    ...base,
    name: pickLocalizedField(doc, 'name', lang),
    description: pickLocalizedField(doc, 'description', lang),
  }
}

function collectProductImageUrls(doc, req) {
  const rawUrls = []

  if (Array.isArray(doc.imageUrls) && doc.imageUrls.length) {
    rawUrls.push(...doc.imageUrls)
  } else {
    if (doc.mainImage) rawUrls.push(doc.mainImage)
    if (Array.isArray(doc.gallery)) rawUrls.push(...doc.gallery)
    if (Array.isArray(doc.images)) {
      for (const img of doc.images) {
        if (img?.url) rawUrls.push(img.url)
      }
    }
  }

  return [...new Set(rawUrls.map((u) => resolveImageUrl(u, req)).filter(Boolean))]
}

function formatSpecifications(doc, lang, includeAllLocales) {
  const specs = doc.specifications || {}
  const dims = specs.dimensions || {}

  if (includeAllLocales) {
    return {
      material_uz: specs.material_uz || '',
      material_ru: specs.material_ru || '',
      material_en: specs.material_en || '',
      dimensions: {
        length: dims.length ?? null,
        width: dims.width ?? null,
        height: dims.height ?? null,
      },
      weight: specs.weight ?? null,
      color_uz: specs.color_uz || '',
      color_ru: specs.color_ru || '',
      color_en: specs.color_en || '',
      warranty_months: specs.warranty_months ?? null,
    }
  }

  return {
    material: pickLocalizedField(specs, 'material', lang),
    dimensions: {
      length: dims.length ?? doc.dimensions?.length ?? doc.dimensions?.depth ?? null,
      width: dims.width ?? doc.dimensions?.width ?? null,
      height: dims.height ?? doc.dimensions?.height ?? null,
    },
    weight: specs.weight ?? null,
    color: pickLocalizedField(specs, 'color', lang),
    warranty_months: specs.warranty_months ?? null,
  }
}

/** Format product for public or admin catalog API */
export function formatCatalogProduct(product, req, lang = 'uz', { includeAllLocales = false } = {}) {
  const doc = product.toObject ? product.toObject() : product
  const images = collectProductImageUrls(doc, req)
  const basePrice = doc.price ?? doc.basePrice ?? 0
  const discountPercent =
    doc.discount_percent ??
    (doc.discountedPrice != null && doc.basePrice
      ? Math.round((1 - doc.discountedPrice / doc.basePrice) * 100)
      : 0)
  const salePrice =
    doc.discountedPrice != null
      ? doc.discountedPrice
      : discountPercent > 0
        ? Math.round(basePrice * (1 - discountPercent / 100))
        : basePrice

  const categoryDoc = doc.category
  const category =
    categoryDoc && typeof categoryDoc === 'object' && categoryDoc._id
      ? {
          id: String(categoryDoc._id),
          name: includeAllLocales
            ? categoryDoc.name
            : pickLocalizedField(categoryDoc, 'name', lang),
          slug: categoryDoc.slug,
        }
      : doc.category
        ? { id: String(doc.category) }
        : null

  const base = {
    id: String(doc._id),
    price: salePrice,
    originalPrice: basePrice,
    discount_percent: discountPercent,
    category,
    images,
    specifications: formatSpecifications(doc, lang, includeAllLocales),
    stock: doc.stock ?? 0,
    viewCount: doc.viewCount ?? 0,
    salesCount: doc.salesCount ?? 0,
    rating: doc.rating ?? 0,
    reviews_count: doc.reviews_count ?? 0,
    sku: doc.sku || '',
    isActive: doc.isActive !== false && doc.isPublished !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }

  if (includeAllLocales) {
    return {
      ...base,
      name: doc.name,
      name_uz: doc.name_uz || doc.name,
      name_ru: doc.name_ru || '',
      name_en: doc.name_en || '',
      description: doc.description || '',
      description_uz: doc.description_uz || doc.description || '',
      description_ru: doc.description_ru || '',
      description_en: doc.description_en || '',
    }
  }

  return {
    ...base,
    name: pickLocalizedField(doc, 'name', lang),
    description: pickLocalizedField(doc, 'description', lang),
  }
}

export { resolveLang }
