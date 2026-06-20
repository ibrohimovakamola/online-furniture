import mongoose from 'mongoose'
import Order from '../models/Order.js'

/**
 * Returns true if the user has a paid order containing the product.
 */
export async function userPurchasedProduct(userId, productId) {
  if (!userId || !productId) return false
  if (!mongoose.Types.ObjectId.isValid(productId)) return false

  const order = await Order.findOne({
    customer: userId,
    paymentStatus: 'paid',
    isDeleted: { $ne: true },
    'items.product': productId,
  }).select('_id')

  return Boolean(order)
}
