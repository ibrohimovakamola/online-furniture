import Order from '../models/Order.js'
import Cart from '../models/Cart.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { buildOrderFromUserCart } from '../utils/buildOrderFromCart.js'
import { generateOrderNumber } from '../utils/orderNumber.js'
import { formatOrder, formatOrderCheckoutResponse } from '../utils/formatOrder.js'
import { sendOrderConfirmationEmail } from '../utils/orderEmails.js'
import PaymeGateway from '../services/payme/PaymeGateway.js'
import ClickGateway from '../services/click/ClickGateway.js'
import { getOrderPayableAmount } from '../utils/orderAmount.js'
import { isPaymeConfigured, isClickConfigured } from '../config/payments.js'
import { logOrderCreated } from '../utils/activityLogger.js'

const payme = new PaymeGateway()
const click = new ClickGateway()

function normalizePaymentStatus(status) {
  if (status === 'pending' || status === 'awaiting') return 'unpaid'
  return status
}

function buildPaymentUrl(order, paymentMethod, returnUrl) {
  const gatewayReturnBase =
    returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
  const gatewayReturnUrl = `${gatewayReturnBase}${gatewayReturnBase.includes('?') ? '&' : '?'}orderId=${order._id}&gateway=${paymentMethod}`

  if (paymentMethod === 'payme') {
    return payme.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: getOrderPayableAmount(order),
      returnUrl: gatewayReturnUrl,
    })
  }
  if (paymentMethod === 'click') {
    return click.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: getOrderPayableAmount(order),
      returnUrl: gatewayReturnUrl,
    })
  }
  return null
}

/** POST /api/orders — create order from user's cart */
export const createOrderFromCart = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const { shippingAddress, paymentMethod, notes, discount_amount, returnUrl } = body

  if (paymentMethod === 'payme' && !isPaymeConfigured()) {
    throw new AppError('Payme payment is not configured', 503)
  }
  if (paymentMethod === 'click' && !isClickConfigured()) {
    throw new AppError('Click payment is not configured', 503)
  }

  const built = await buildOrderFromUserCart(req.user._id, { discount_amount })
  const isGateway = paymentMethod === 'payme' || paymentMethod === 'click'
  const paymentStatus = isGateway ? 'unpaid' : paymentMethod === 'cash' ? 'unpaid' : 'paid'
  const status = isGateway || paymentMethod === 'cash' ? 'pending' : 'confirmed'

  const order = await Order.create({
    orderNumber: await generateOrderNumber(),
    customer: req.user._id,
    items: built.orderItems,
    status,
    paymentStatus,
    paymentMethod,
    shippingAddress: {
      ...shippingAddress,
      email: shippingAddress.email || req.user.email,
    },
    subtotal: built.subtotal,
    totalPrice: built.totalPrice,
    discount_amount: built.discount_amount,
    finalPrice: built.finalPrice,
    shippingCost: built.shippingCost,
    serviceFees: built.serviceFees,
    total: built.finalPrice,
    notes: notes || '',
    orderNotes: notes || '',
    statusHistory: [
      {
        status,
        changedBy: req.user._id,
        note: isGateway ? `Awaiting ${paymentMethod} payment` : 'Order placed',
      },
    ],
    metadata: { stockDeducted: false },
  })

  if (!isGateway && paymentMethod === 'cash') {
    for (const { product, quantity } of built.stockUpdates) {
      product.stock -= quantity
      await product.save()
    }
    order.metadata = { stockDeducted: true }
    await order.save()
  }

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })
  await order.populate('customer', 'firstName lastName email')

  if (!isGateway) {
    sendOrderConfirmationEmail(order)
  }

  const paymentUrl = isGateway ? buildPaymentUrl(order, paymentMethod, returnUrl) : null

  logOrderCreated(order, req)

  res.status(201).json({
    success: true,
    message: isGateway
      ? 'Order created. Complete payment to confirm.'
      : 'Order created successfully.',
    data: formatOrderCheckoutResponse(order, paymentUrl),
  })
})

/** GET /api/orders — authenticated user's orders with pagination */
export const listUserOrders = asyncHandler(async (req, res) => {
  const query = req.validated || req.query
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50)
  const skip = (page - 1) * limit

  const filter = { customer: req.user._id }
  if (query.status) filter.status = query.status

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: {
      orders: orders.map(formatOrder),
      total,
      page,
      limit,
    },
  })
})

/** GET /api/orders/:orderId — single order for current user */
export const getUserOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId || req.params.id,
    customer: req.user._id,
  }).populate('customer', 'firstName lastName email')

  if (!order) throw new AppError('Order not found', 404)

  res.json({
    success: true,
    data: { order: formatOrder(order) },
  })
})

export { normalizePaymentStatus }
