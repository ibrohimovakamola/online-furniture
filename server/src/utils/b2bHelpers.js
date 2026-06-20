import B2BProfile from '../models/B2BProfile.js'
import { AppError } from './asyncHandler.js'
import { buildImageUrl } from './helpers.js'
import { calculateB2BLinePrice } from '../config/b2b.js'

export function formatB2BProduct(product, req, quantity = 1) {
  const retail = product.discountedPrice ?? product.basePrice
  const pricing = calculateB2BLinePrice({
    retailPrice: retail,
    wholesalePrice: product.wholesalePrice,
    quantity,
  })

  return {
    id: product._id,
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    description: product.description,
    retailPrice: retail,
    wholesalePrice: pricing.wholesaleUnit,
    unitPrice: pricing.unitPrice,
    stock: product.stock,
    b2bOnly: product.b2bOnly,
    bulkPackSize: product.bulkPackSize,
    materials: product.materials,
    colors: product.colors,
    dimensions: product.dimensions,
    filters: product.filters,
    technicalSpecs: product.technicalSpecs,
    model3dUrl: product.model3dUrl,
    mainImage: buildImageUrl(product.mainImage, req),
    gallery: (product.gallery || []).map((g) => buildImageUrl(g, req)),
    category: product.category,
    inStock: product.stock > 0,
    pricing,
    createdAt: product.createdAt,
  }
}

export function buildB2BProductFilter(query) {
  const { category, search = '', material = '', color = '', inStock, b2bOnly } = query
  const filter = { isPublished: true }

  if (category) filter.category = category
  if (material) filter.materials = new RegExp(material, 'i')
  if (color) filter['filters.color'] = new RegExp(color, 'i')
  if (inStock === 'true') filter.stock = { $gt: 0 }
  if (b2bOnly === 'true') filter.b2bOnly = true
  if (search.trim()) filter.$text = { $search: search.trim() }

  return filter
}

export async function getB2BProfileForUser(userId) {
  return B2BProfile.findOne({ user: userId })
}

export async function requireVerifiedB2BProfile(userId) {
  const profile = await getB2BProfileForUser(userId)
  if (!profile) {
    throw new AppError('B2B profile not found. Complete registration first.', 404)
  }
  if (profile.status !== 'verified') {
    throw new AppError(`Verified B2B account required (status: ${profile.status})`, 403)
  }
  return profile
}

export function formatB2BOrder(order) {
  const doc = order.toObject ? order.toObject() : order
  return {
    id: doc._id,
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    serviceFees: doc.serviceFees,
    total: doc.total,
    items: doc.items,
    shippingAddress: doc.shippingAddress,
    isB2B: doc.isB2B,
    poNumber: doc.poNumber,
    orderNotes: doc.orderNotes,
    estimatedDeliveryDate: doc.estimatedDeliveryDate,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function buildInvoiceHtml(invoice, profile, order) {
  const lines = invoice.lines
    .map(
      (l) =>
        `<tr><td>${l.name}</td><td>${l.quantity}</td><td>${l.unitPrice.toLocaleString()}</td><td>${l.lineTotal.toLocaleString()}</td></tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0b3c3c}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#0b3c3c;color:#fff}</style>
</head><body>
<h1>INVOICE ${invoice.invoiceNumber}</h1>
<p><strong>${profile?.companyName || invoice.companyName}</strong><br>PO: ${invoice.poNumber || '—'}<br>Terms: ${invoice.paymentTerms}</p>
<p>Order: ${order?.orderNumber || '—'}<br>Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table>
<p><strong>Subtotal:</strong> ${invoice.subtotal.toLocaleString()} UZS<br>
<strong>Total:</strong> ${invoice.total.toLocaleString()} UZS</p>
</body></html>`
}
