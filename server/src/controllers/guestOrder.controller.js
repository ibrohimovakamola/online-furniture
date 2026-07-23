import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import Order from '../models/Order.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { buildOrderFromCart } from '../utils/buildOrderFromCart.js'
import { formatGuestOrder } from '../utils/formatOrder.js'
import { sendGuestOrderConfirmation } from '../utils/guestOrderEmails.js'
import PaymeGateway from '../services/payme/PaymeGateway.js'
import ClickGateway from '../services/click/ClickGateway.js'
import { generateUzumCheckout } from '../services/payment/index.js'
import { isPaymeConfigured, isClickConfigured, isUzumBankConfigured } from '../config/payments.js'

const payme = new PaymeGateway()
const click = new ClickGateway()

function hashTrackingToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function buildTrackingLink(token) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${base}/track/${encodeURIComponent(token)}`
}

function signGuestTrackingToken(orderId, email) {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 8) {
    throw new AppError('Server auth configuration error', 500)
  }
  return jwt.sign(
    { orderId: String(orderId), email: email.toLowerCase(), type: 'guest_track' },
    secret,
    { expiresIn: '30d' }
  )
}

/** POST /api/orders/guest */
export const createGuestOrder = asyncHandler(async (req, res) => {
  const value = req.validated || req.body
  const isGateway =
    value.paymentMethod === 'payme' ||
    value.paymentMethod === 'click' ||
    value.paymentMethod === 'uzumbank'

  if (value.paymentMethod === 'payme' && !isPaymeConfigured()) {
    throw new AppError('Payme payment is not configured', 503)
  }
  if (value.paymentMethod === 'click' && !isClickConfigured()) {
    throw new AppError('Click payment is not configured', 503)
  }
  if (value.paymentMethod === 'uzumbank' && !isUzumBankConfigured()) {
    throw new AppError('Uzum Bank payment is not configured', 503)
  }

  const built = await buildOrderFromCart({
    items: value.items,
    premiumServices: value.premiumServices,
    paymentMethod: value.paymentMethod,
  })

  if (Math.abs(built.orderTotal - value.totalPrice) > 1) {
    throw new AppError('Order total has changed. Please refresh your cart and try again.', 400)
  }

  const paymentStatus =
    value.paymentMethod === 'cash' ? 'pending' : isGateway ? 'awaiting' : 'pending'
  const orderStatus = 'pending'
  const statusNote =
    value.paymentMethod === 'cash'
      ? 'Guest order — cash on delivery'
      : `Guest order — awaiting ${value.paymentMethod} payment`

  const order = await Order.create({
    orderNumber: `ORD-${Date.now()}`,
    customer: null,
    isGuest: true,
    guest: {
      email: value.guestEmail.toLowerCase(),
      phone: value.guestPhone,
      name: value.guestName,
    },
    items: built.orderItems,
    status: orderStatus,
    paymentStatus,
    paymentMethod: value.paymentMethod,
    shippingAddress: {
      fullName: value.guestName,
      phone: value.guestPhone,
      email: value.guestEmail.toLowerCase(),
      street: value.shippingAddress.street,
      city: value.shippingAddress.city,
      region: value.shippingAddress.region || '',
      postalCode: value.shippingAddress.zipCode || value.shippingAddress.postalCode || '',
      country: 'Uzbekistan',
    },
    subtotal: built.subtotal,
    shippingCost: built.shippingCost,
    serviceFees: built.serviceFees,
    premiumServices: value.premiumServices || {},
    total: built.orderTotal,
    statusHistory: [{ status: orderStatus, note: statusNote }],
    metadata: { stockDeducted: false, guestCheckout: true },
  })

  const trackingToken = signGuestTrackingToken(order._id, value.guestEmail)
  order.trackingToken = hashTrackingToken(trackingToken)
  await order.save()

  let paymentUrl = null
  if (isGateway) {
    const gatewayReturnBase =
      value.returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
    const gatewayReturnUrl = `${gatewayReturnBase}${gatewayReturnBase.includes('?') ? '&' : '?'}orderId=${order._id}&gateway=${value.paymentMethod}&guest=1`

    if (value.paymentMethod === 'payme') {
      paymentUrl = payme.generatePaymentUrl({
        orderId: order._id.toString(),
        amountUzs: order.total,
        returnUrl: gatewayReturnUrl,
      })
    } else if (value.paymentMethod === 'click') {
      paymentUrl = click.generatePaymentUrl({
        orderId: order._id.toString(),
        amountUzs: order.total,
        returnUrl: gatewayReturnUrl,
      })
    } else if (value.paymentMethod === 'uzumbank') {
      paymentUrl = await generateUzumCheckout(
        order._id.toString(),
        order.total,
        `Buyurtma ${order.orderNumber}`,
        { returnUrl: gatewayReturnUrl, orderNumber: order.orderNumber }
      )
    }
  }

  const trackingLink = buildTrackingLink(trackingToken)
  sendGuestOrderConfirmation({ order, trackingLink })

  res.status(201).json({
    success: true,
    orderId: order._id,
    orderNumber: order.orderNumber,
    trackingToken,
    trackingLink,
    paymentUrl,
    gateway: isGateway ? value.paymentMethod : null,
    order: formatGuestOrder(order),
  })
})

/** GET /api/orders/track/:token */
export const trackGuestOrder = asyncHandler(async (req, res) => {
  let decoded
  try {
    decoded = jwt.verify(req.params.token, process.env.JWT_SECRET)
  } catch {
    throw new AppError('Invalid or expired tracking token', 401)
  }

  if (decoded.type !== 'guest_track' || !decoded.orderId || !decoded.email) {
    throw new AppError('Invalid tracking token', 401)
  }

  const order = await Order.findById(decoded.orderId).select('+trackingToken')
  if (!order || !order.isGuest) {
    throw new AppError('Order not found', 404)
  }

  const guestEmail = order.guest?.email?.toLowerCase()
  if (!guestEmail || guestEmail !== String(decoded.email).toLowerCase()) {
    throw new AppError('Order not found', 404)
  }

  if (order.trackingToken && order.trackingToken !== hashTrackingToken(req.params.token)) {
    throw new AppError('Tracking token has been revoked', 401)
  }

  res.json({
    success: true,
    order: formatGuestOrder(order),
  })
})
