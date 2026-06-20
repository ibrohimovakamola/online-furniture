import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { AppError, Errors, asyncHandler } from '../utils/asyncHandler.js'
import { formatB2BOrder } from '../utils/b2bHelpers.js'
import { calculateB2BLinePrice } from '../config/b2b.js'
import { getOrCreateSettings, calculateShippingCost } from '../utils/settingsHelper.js'

const EDITABLE_STATUSES = ['pending']

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

async function buildB2BOrderItems(items) {
  const orderItems = []
  let subtotal = 0

  for (const line of items) {
    const product = await Product.findById(line.productId)
    if (!product || !product.isPublished) {
      throw new AppError(`Product not found: ${line.productId}`, 400)
    }
    const qty = Math.max(Number(line.quantity) || 1, 1)
    if (product.stock < qty) {
      throw Errors.insufficientStock(`Insufficient stock for ${product.name}`)
    }

    const retail = product.discountedPrice ?? product.basePrice
    const pricing = calculateB2BLinePrice({
      retailPrice: retail,
      wholesalePrice: product.wholesalePrice,
      quantity: qty,
    })

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: qty,
      unitPrice: pricing.unitPrice,
      lineTotal: pricing.lineTotal,
      color: line.color || '',
    })
    subtotal += pricing.lineTotal
  }

  return { orderItems, subtotal }
}

async function placeB2BOrder(req, body) {
  const { items, shippingAddress, paymentMethod = 'bank_transfer', poNumber, orderNotes } = body
  if (!items?.length) throw new AppError('Order items are required', 400)
  if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city) {
    throw new AppError('Complete shipping address is required', 400)
  }

  const { orderItems, subtotal } = await buildB2BOrderItems(items)
  const siteSettings = await getOrCreateSettings()
  const shippingCost = calculateShippingCost(subtotal, siteSettings.shipping)
  const total = subtotal + shippingCost

  const normalizedPayment = ['bank_transfer', 'card', 'cash'].includes(paymentMethod)
    ? paymentMethod
    : 'bank_transfer'

  const order = await Order.create({
    orderNumber: `B2B-${Date.now()}`,
    customer: req.user._id,
    items: orderItems,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: normalizedPayment,
    shippingAddress: {
      ...shippingAddress,
      email: shippingAddress.email || req.user.email,
    },
    subtotal,
    shippingCost,
    serviceFees: 0,
    total,
    isB2B: true,
    poNumber: String(poNumber || '').trim(),
    orderNotes: String(orderNotes || '').trim(),
    estimatedDeliveryDate: addDays(new Date(), 5),
    statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'B2B order placed' }],
  })

  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  }

  req.b2bProfile.accountBalance += total
  await req.b2bProfile.save()

  return order
}

/** POST /api/b2b/orders */
export const createB2BOrder = asyncHandler(async (req, res) => {
  const order = await placeB2BOrder(req, req.body)

  res.status(201).json({
    success: true,
    message: 'B2B order placed successfully',
    order: formatB2BOrder(order),
  })
})

/** GET /api/b2b/orders */
export const listB2BOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id, isB2B: true })
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, orders: orders.map(formatB2BOrder) })
})

/** GET /api/b2b/orders/:orderId */
export const getB2BOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    customer: req.user._id,
    isB2B: true,
  }).lean()

  if (!order) throw new AppError('Order not found', 404)
  res.json({ success: true, order: formatB2BOrder(order) })
})

/** PUT /api/b2b/orders/:orderId */
export const updateB2BOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    customer: req.user._id,
    isB2B: true,
  })

  if (!order) throw new AppError('Order not found', 404)
  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw new AppError('Order cannot be updated after processing has started', 400)
  }

  const { poNumber, orderNotes, shippingAddress } = req.body
  if (poNumber != null) order.poNumber = String(poNumber).trim()
  if (orderNotes != null) order.orderNotes = String(orderNotes).trim()
  if (shippingAddress) order.shippingAddress = { ...order.shippingAddress.toObject?.() || order.shippingAddress, ...shippingAddress }

  await order.save()
  res.json({ success: true, order: formatB2BOrder(order) })
})

/** DELETE /api/b2b/orders/:orderId */
export const cancelB2BOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    customer: req.user._id,
    isB2B: true,
  })

  if (!order) throw new AppError('Order not found', 404)
  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw new AppError('Order cannot be cancelled after processing has started', 400)
  }

  order.status = 'cancelled'
  order.statusHistory.push({
    status: 'cancelled',
    changedBy: req.user._id,
    note: 'Cancelled by B2B customer',
  })
  await order.save()

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
  }

  res.json({ success: true, message: 'Order cancelled', order: formatB2BOrder(order) })
})

/** POST /api/b2b/orders/:orderId/reorder */
export const reorderB2BOrder = asyncHandler(async (req, res) => {
  const source = await Order.findOne({
    _id: req.params.orderId,
    customer: req.user._id,
    isB2B: true,
  }).lean()

  if (!source) throw new AppError('Order not found', 404)

  const items = source.items.map((i) => ({ productId: i.product, quantity: i.quantity, color: i.color }))
  const order = await placeB2BOrder(req, {
    items,
    shippingAddress: source.shippingAddress,
    paymentMethod: source.paymentMethod,
    poNumber: source.poNumber,
    orderNotes: `Reorder from ${source.orderNumber}`,
  })

  res.status(201).json({
    success: true,
    message: 'Reorder placed successfully',
    order: formatB2BOrder(order),
  })
})
