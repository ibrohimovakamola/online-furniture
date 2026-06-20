import Product from '../models/Product.js'
import Order from '../models/Order.js'
import { Errors } from './AppError.js'
import { sendOrderConfirmation, sendPaymentReceipt } from '../controllers/emailController.js'
import { incrementProductSalesCounts } from './productSearch.js'
import { logPaymentCompleted, logPaymentFailed } from './activityLogger.js'

/**
 * Mark order paid, deduct inventory, notify customer.
 * Idempotent — safe to call multiple times for same paid order.
 */
export async function fulfillOrderPayment(order, { note = 'Payment confirmed', changedBy = null } = {}) {
  if (!order) return { fulfilled: false, reason: 'no_order' }

  const fresh = await Order.findById(order._id || order).populate('customer', 'firstName lastName email')
  if (!fresh) return { fulfilled: false, reason: 'not_found' }

  const alreadyPaid =
    fresh.paymentStatus === 'paid' &&
    ['confirmed', 'processing', 'shipped', 'delivered'].includes(fresh.status)

  if (alreadyPaid) {
    return { fulfilled: true, reason: 'already_paid', order: fresh }
  }

  const alreadyFulfilled = fresh.metadata?.stockDeducted === true

  if (!alreadyFulfilled) {
    for (const item of fresh.items) {
      const product = await Product.findById(item.product)
      if (!product) continue
      if (product.stock < item.quantity) {
        throw Errors.insufficientStock(`Insufficient stock for ${product.name}`)
      }
      product.stock -= item.quantity
      await product.save()
    }
    fresh.metadata = { ...(fresh.metadata || {}), stockDeducted: true }
  }

  fresh.paymentStatus = 'paid'
  if (fresh.status === 'pending' || fresh.status === 'processing') {
    fresh.status = 'confirmed'
  }

  fresh.statusHistory.push({
    status: fresh.status,
    changedBy,
    note,
    changedAt: new Date(),
  })

  await fresh.save()

  sendPaymentReceipt(fresh)
  sendOrderConfirmation(fresh)
  incrementProductSalesCounts(fresh.items)
  logPaymentCompleted(fresh, { note })

  return { fulfilled: true, reason: 'completed', order: fresh }
}

/**
 * Record failed gateway payment — order stays pending for retry.
 */
export async function cancelPendingOrder(order, { note = 'Payment failed', changedBy = null } = {}) {
  const fresh = await Order.findById(order._id || order)
  if (!fresh) return null

  if (fresh.paymentStatus === 'paid') return fresh

  fresh.paymentStatus = 'unpaid'
  if (fresh.status === 'pending') {
    /* keep pending — customer can retry payment */
  }

  fresh.statusHistory.push({
    status: fresh.status,
    changedBy,
    note,
    changedAt: new Date(),
  })
  await fresh.save()
  logPaymentFailed(fresh, { note })
  return fresh
}
