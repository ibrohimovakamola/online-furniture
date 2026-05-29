import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { getOrCreateSettings, calculateShippingCost } from '../utils/settingsHelper.js'
import { calculatePremiumServiceFees } from '../config/premiumServices.js'

function formatOrder(order) {
  const doc = order.toObject ? order.toObject() : order
  const customer = doc.customer
  return {
    id: doc._id,
    orderNumber: doc.orderNumber,
    customerName: customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : 'Unknown',
    customerEmail: customer?.email || doc.shippingAddress?.email || '',
    date: doc.createdAt,
    total: doc.total,
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    items: doc.items,
    shippingAddress: doc.shippingAddress,
    createdAt: doc.createdAt,
  }
}

export const checkout = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'online', payment, premiumServices } = req.body

  if (!items?.length) throw new AppError('Cart is empty', 400)
  if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city) {
    throw new AppError('Complete shipping address is required', 400)
  }

  if (!payment?.cardNumber || !payment?.expiry || !payment?.cvv) {
    throw new AppError('Payment details are required', 400)
  }
  if (String(payment.cardNumber).replace(/\s/g, '').length < 13) {
    throw new AppError('Invalid card number', 400)
  }

  const orderItems = []
  let subtotal = 0
  const stockUpdates = []

  for (const item of items) {
    const product = await Product.findById(item.productId || item.id)
    if (!product || !product.isPublished) {
      throw new AppError(`Product not available: ${item.name || item.productId}`, 400)
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400)
    }

    const unitPrice = product.discountedPrice ?? product.basePrice
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      color: item.color || '',
    })

    stockUpdates.push({ product, quantity: item.quantity })
  }

  const siteSettings = await getOrCreateSettings()
  const shippingCost = calculateShippingCost(subtotal, siteSettings.shipping)
  const { total: serviceFees } = calculatePremiumServiceFees(premiumServices || {})
  const total = subtotal + shippingCost + serviceFees

  const order = await Order.create({
    orderNumber: `ORD-${Date.now()}`,
    customer: req.user._id,
    items: orderItems,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod,
    shippingAddress: {
      ...shippingAddress,
      email: shippingAddress.email || req.user.email,
    },
    subtotal,
    shippingCost,
    serviceFees,
    premiumServices: {
      deliveryToFloor: Boolean(premiumServices?.deliveryToFloor),
      professionalAssembly: Boolean(premiumServices?.professionalAssembly),
    },
    total,
    statusHistory: [{ status: 'processing', changedBy: req.user._id, note: 'Order placed via checkout' }],
  })

  for (const { product, quantity } of stockUpdates) {
    product.stock -= quantity
    await product.save()
  }

  await order.populate('customer', 'firstName lastName email')

  res.status(201).json({
    success: true,
    message: 'Payment successful. Order placed.',
    order: formatOrder(order),
  })
})

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('customer', 'firstName lastName email')
    .sort({ createdAt: -1 })

  res.json({ success: true, orders: orders.map(formatOrder) })
})

export { formatOrder }
