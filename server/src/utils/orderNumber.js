import Order from '../models/Order.js'

/**
 * Generate sequential order number: ORD-2024001, ORD-2024002, …
 */
export async function generateOrderNumber() {
  const year = new Date().getFullYear()
  const prefix = `ORD-${year}`

  const last = await Order.findOne({ orderNumber: new RegExp(`^${prefix}\\d+$`) })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean()

  let seq = 1
  if (last?.orderNumber) {
    const suffix = last.orderNumber.slice(prefix.length)
    const parsed = parseInt(suffix, 10)
    if (!Number.isNaN(parsed)) seq = parsed + 1
  }

  return `${prefix}${String(seq).padStart(3, '0')}`
}
