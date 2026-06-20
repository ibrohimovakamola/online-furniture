import ActivityLog, { ACTIVITY_TYPES } from '../models/ActivityLog.js'

export { ACTIVITY_TYPES }

export const ACTIONS = {
  VIEWED_PRODUCT: 'viewed_product',
  ADDED_TO_CART: 'added_to_cart',
  ORDER_CREATED: 'order_created',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  REVIEW_POSTED: 'review_posted',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
}

export function getRequestMeta(req) {
  if (!req) return { ipAddress: '', userAgent: '' }
  const forwarded = req.headers?.['x-forwarded-for']
  const ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip) || ''
  return {
    ipAddress: ipAddress.trim(),
    userAgent: String(req.headers?.['user-agent'] || '').slice(0, 500),
  }
}

/**
 * Fire-and-forget activity log. Never throws — safe to call from any handler.
 */
export function logActivity(
  {
    type,
    action,
    userId = null,
    productId = null,
    orderId = null,
    details = {},
  },
  req = null
) {
  if (!type || !action) return

  const meta = getRequestMeta(req)

  ActivityLog.create({
    type,
    action,
    userId: userId || req?.user?._id || null,
    productId,
    orderId,
    details,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  }).catch((err) => {
    console.error('[activityLog]', err.message)
  })
}

export function logProductView(productId, req) {
  logActivity(
    {
      type: 'view',
      action: ACTIONS.VIEWED_PRODUCT,
      productId,
      details: {
        path: req?.originalUrl || req?.path,
        referrer: req?.headers?.referer || req?.headers?.referrer || '',
      },
    },
    req
  )
}

export function logCartAdd(productId, req, details = {}) {
  logActivity(
    {
      type: 'view',
      action: ACTIONS.ADDED_TO_CART,
      productId,
      details,
    },
    req
  )
}

export function logOrderCreated(order, req) {
  logActivity(
    {
      type: 'purchase',
      action: ACTIONS.ORDER_CREATED,
      orderId: order._id,
      details: {
        orderNumber: order.orderNumber,
        total: order.total ?? order.finalPrice,
        paymentMethod: order.paymentMethod,
        itemCount: order.items?.length || 0,
      },
    },
    req
  )
}

export function logPaymentCompleted(order, details = {}) {
  logActivity(
    {
      type: 'purchase',
      action: ACTIONS.PAYMENT_COMPLETED,
      userId: order.customer,
      orderId: order._id,
      details: {
        orderNumber: order.orderNumber,
        total: order.total ?? order.finalPrice,
        ...details,
      },
    },
    null
  )
}

export function logPaymentFailed(order, details = {}) {
  logActivity(
    {
      type: 'purchase',
      action: ACTIONS.PAYMENT_FAILED,
      userId: order?.customer,
      orderId: order?._id,
      details,
    },
    null
  )
}

export function logReviewPosted(review, req) {
  logActivity(
    {
      type: 'review',
      action: ACTIONS.REVIEW_POSTED,
      productId: review.product,
      details: {
        reviewId: String(review._id),
        rating: review.rating,
      },
    },
    req
  )
}

export function logUserSignup(user, req) {
  logActivity(
    {
      type: 'login',
      action: ACTIONS.USER_SIGNUP,
      userId: user._id,
      details: { email: user.email },
    },
    req
  )
}

export function logUserLogin(user, req) {
  logActivity(
    {
      type: 'login',
      action: ACTIONS.USER_LOGIN,
      userId: user._id,
      details: { email: user.email },
    },
    req
  )
}

export function logAdminActivity(req, action, details = {}) {
  logActivity(
    {
      type: 'admin_action',
      action,
      details,
    },
    req
  )
}
