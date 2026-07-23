import Product from '../models/Product.js'
import Order from '../models/Order.js'
import { Errors } from './AppError.js'
import { sendOrderConfirmation, sendPaymentReceipt } from '../controllers/emailController.js'
import { incrementProductSalesCounts } from './productSearch.js'
import { logPaymentCompleted, logPaymentFailed } from './activityLogger.js'
import { getInitialNextPaymentDate } from '../config/installmentPlans.js'

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

/**
 * Record first/subsequent installment payment via online gateway.
 * Deducts stock on first payment; marks fully paid when all months covered.
 */
export async function fulfillInstallmentGatewayPayment(
  order,
  { note = 'Installment gateway payment confirmed', changedBy = null, gateway = 'payme' } = {}
) {
  if (!order) return { fulfilled: false, reason: 'no_order' }

  const fresh = await Order.findById(order._id || order).populate('customer', 'firstName lastName email')
  if (!fresh?.installmentDetails) return { fulfilled: false, reason: 'not_installment' }

  const details = fresh.installmentDetails
  if (details.paidMonths >= details.planMonths) {
    return { fulfilled: true, reason: 'already_complete', order: fresh }
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

  details.paidMonths += 1
  details.remainingBalance = Math.max(
    0,
    Math.round((details.remainingBalance - details.monthlyPayment) * 100) / 100
  )

  if (details.paidMonths >= details.planMonths) {
    details.remainingBalance = 0
    details.nextPaymentDate = null
    fresh.paymentStatus = 'paid'
    if (fresh.status === 'pending') fresh.status = 'processing'
  } else {
    details.nextPaymentDate = getInitialNextPaymentDate(new Date())
    fresh.paymentStatus = 'pending'
    if (fresh.status === 'pending') fresh.status = 'processing'
  }

  fresh.metadata = {
    ...(fresh.metadata || {}),
    installmentGateway: gateway,
  }

  fresh.statusHistory.push({
    status: fresh.status,
    changedBy,
    note,
    changedAt: new Date(),
  })

  await fresh.save()

  if (details.paidMonths === 1) {
    sendOrderConfirmation(fresh)
  }
  sendPaymentReceipt(fresh)
  incrementProductSalesCounts(fresh.items)
  logPaymentCompleted(fresh, { note, gateway })

  return { fulfilled: true, reason: 'installment_recorded', order: fresh }
}
