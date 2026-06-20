const PRODUCT_FIELD_ALLOWLIST = new Set([
  'id',
  '_id',
  'name',
  'slug',
  'sku',
  'description',
  'price',
  'basePrice',
  'discountedPrice',
  'discount_percent',
  'mainImage',
  'imageUrls',
  'images',
  'gallery',
  'rating',
  'reviews_count',
  'stock',
  'category',
  'colors',
  'materials',
  'dimensions',
  'specifications',
  'filters',
  'isFlashSale',
  'flashSaleDiscountPercent',
  'highlights',
  'createdAt',
])

/**
 * Parse ?fields=name,price,rating from query object.
 * Returns null when omitted (full payload).
 */
export function parseFieldSelection(query = {}) {
  const raw = query.fields
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null
  return [...new Set(raw.split(',').map((f) => f.trim()).filter(Boolean))]
}

/**
 * Pick whitelisted fields from a plain object (public catalog responses).
 */
export function pickAllowedFields(obj, fields, allowlist = PRODUCT_FIELD_ALLOWLIST) {
  if (!fields?.length || !obj || typeof obj !== 'object') return obj
  const picked = {}
  for (const key of fields) {
    if (!allowlist.has(key)) continue
    if (key in obj) picked[key] = obj[key]
  }
  return Object.keys(picked).length ? picked : obj
}

export function applyFieldSelection(items, fields) {
  if (!fields?.length) return items
  if (Array.isArray(items)) {
    return items.map((item) => pickAllowedFields(item, fields))
  }
  return pickAllowedFields(items, fields)
}
