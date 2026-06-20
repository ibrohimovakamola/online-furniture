import Order from '../models/Order.js'
import User from '../models/User.js'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatOrder } from '../utils/formatOrder.js'
import { buildCreatedAtFilter, parseDateRangeQuery } from '../utils/dateRange.js'
import { getInitialNextPaymentDate } from '../config/installmentPlans.js'
import { sendOrderStatusUpdate } from './emailController.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'
import { logAdminAction } from '../utils/adminActionLog.js'
import { buildSearchRegex } from '../utils/safeRegex.js'

const PUBLIC_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded']
const NOT_DELETED = { isDeleted: { $ne: true } }

function buildOrderListFilter(query = {}) {
  const dateFilter = buildCreatedAtFilter(parseDateRangeQuery(query))
  const filter = { ...dateFilter, ...NOT_DELETED }

  if (query.status) filter.status = query.status
  if (query.paymentStatus) {
    if (query.paymentStatus === 'unpaid') {
      filter.paymentStatus = { $in: ['unpaid', 'pending', 'awaiting', 'failed'] }
    } else {
      filter.paymentStatus = query.paymentStatus
    }
  }
  if (query.paymentMethod === 'installment') {
    filter.paymentMethod = 'installment'
  } else if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod
  }

  return filter
}

export const listOrders = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const { search = '', paymentMethod = '' } = q
  const { limit, page, skip } = parsePagination(q)
  const filter = buildOrderListFilter({ ...q, paymentMethod: paymentMethod || q.paymentMethod })

  if (search.trim()) {
    const regex = buildSearchRegex(search)
    if (regex) {
      const customers = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      }).select('_id')
      filter.$or = [
        { orderNumber: regex },
        { customer: { $in: customers.map((c) => c._id) } },
        { 'guest.email': regex },
        { 'shippingAddress.fullName': regex },
      ]
    }
  }

  const sortField = q.sortBy === 'total' ? { total: -1 } : { createdAt: -1 }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'firstName lastName email')
      .sort(sortField)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ])

  res.json(buildPaginatedResponse(orders.map(formatOrder), { total, page, limit }))
})

/** GET /api/admin/orders/:orderId */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId || req.params.id,
    ...NOT_DELETED,
  }).populate('customer', 'firstName lastName email phone')

  if (!order) throw new AppError('Order not found', 404)

  res.json({
    success: true,
    data: { order: formatOrder(order) },
  })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const { status, note } = body

  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError('Invalid order status', 400)
  }

  const order = await Order.findById(req.params.orderId || req.params.id)
  if (!order) throw new AppError('Order not found', 404)

  order.status = status
  order.statusHistory.push({
    status,
    changedBy: req.user._id,
    note: note || '',
  })

  await order.save()
  await order.populate('customer', 'firstName lastName email')

  sendOrderStatusUpdate(order, status)
  logAdminAction(req, 'order.status_update', {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    status,
  })

  res.json({
    success: true,
    message: 'Order status updated',
    data: { order: formatOrder(order) },
  })
})

/** PUT /api/orders/:orderId/payment-status — admin */
export const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const { paymentStatus, note } = body

  if (!PUBLIC_PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AppError('Invalid payment status', 400)
  }

  const order = await Order.findById(req.params.orderId || req.params.id)
  if (!order) throw new AppError('Order not found', 404)

  const storedStatus =
    paymentStatus === 'unpaid' && order.paymentStatus === 'awaiting'
      ? 'awaiting'
      : paymentStatus === 'unpaid'
        ? 'pending'
        : paymentStatus

  if (!PAYMENT_STATUSES.includes(storedStatus)) {
    throw new AppError('Invalid payment status', 400)
  }

  order.paymentStatus = storedStatus

  if (paymentStatus === 'paid' && order.status === 'pending') {
    order.status = 'confirmed'
    order.statusHistory.push({
      status: 'confirmed',
      changedBy: req.user._id,
      note: note || 'Payment confirmed',
    })
  }

  order.statusHistory.push({
    status: order.status,
    changedBy: req.user._id,
    note: note || `Payment status set to ${paymentStatus}`,
  })

  await order.save()
  await order.populate('customer', 'firstName lastName email')

  logAdminAction(req, 'order.payment_status_update', {
    orderId: String(order._id),
    paymentStatus,
  })

  res.json({
    success: true,
    message: 'Payment status updated',
    data: { order: formatOrder(order) },
  })
})

/** DELETE /api/admin/orders/:orderId — soft delete */
export const softDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId || req.params.id,
    ...NOT_DELETED,
  })

  if (!order) throw new AppError('Order not found', 404)

  order.isDeleted = true
  order.deletedAt = new Date()
  order.deletedBy = req.user._id
  order.statusHistory.push({
    status: order.status,
    changedBy: req.user._id,
    note: req.body?.note || 'Order archived by admin',
  })

  await order.save()

  logAdminAction(req, 'order.soft_delete', {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
  })

  res.json({
    success: true,
    message: 'Order deleted',
    data: { orderId: order._id },
  })
})

/** GET /api/admin/orders/export — CSV */
export const exportOrdersCsv = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const filter = buildOrderListFilter(q)

  const orders = await Order.find(filter)
    .populate('customer', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(5000)

  const header = [
    'orderNumber',
    'date',
    'customerName',
    'customerEmail',
    'status',
    'paymentStatus',
    'paymentMethod',
    'total',
    'itemsCount',
  ]

  const escapeCsv = (val) => {
    const s = String(val ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const rows = orders.map((o) => {
    const formatted = formatOrder(o)
    return [
      formatted.orderNumber,
      formatted.date ? new Date(formatted.date).toISOString() : '',
      formatted.customerName,
      formatted.customerEmail,
      formatted.status,
      formatted.paymentStatus,
      formatted.paymentMethod,
      formatted.total,
      formatted.items?.length || 0,
    ]
      .map(escapeCsv)
      .join(',')
  })

  const csv = [header.join(','), ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"')
  res.send(`\uFEFF${csv}`)
})

/**
 * Record one monthly installment payment (admin manual or webhook placeholder).
 * PATCH /api/admin/orders/:id/installment-payment
 */
export const recordInstallmentPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw new AppError('Order not found', 404)

  if (order.paymentMethod !== 'installment' || !order.installmentDetails) {
    throw new AppError('This order is not an installment order', 400)
  }

  const details = order.installmentDetails
  if (details.paidMonths >= details.planMonths) {
    throw new AppError('All installment payments have already been recorded', 400)
  }

  details.paidMonths += 1
  details.remainingBalance = Math.max(
    0,
    Math.round((details.remainingBalance - details.monthlyPayment) * 100) / 100
  )

  if (details.paidMonths >= details.planMonths) {
    details.remainingBalance = 0
    details.nextPaymentDate = null
    order.paymentStatus = 'paid'
    if (order.status === 'pending') {
      order.status = 'processing'
      order.statusHistory.push({
        status: 'processing',
        changedBy: req.user._id,
        note: 'Installment plan fully paid',
      })
    }
  } else {
    details.nextPaymentDate = getInitialNextPaymentDate(new Date())
    order.paymentStatus = 'pending'
  }

  order.statusHistory.push({
    status: order.status,
    changedBy: req.user._id,
    note: req.body.note || `Installment payment ${details.paidMonths}/${details.planMonths} recorded`,
  })

  await order.save()
  await order.populate('customer', 'firstName lastName email')

  res.json({
    success: true,
    message: `Payment ${details.paidMonths} of ${details.planMonths} recorded`,
    order: formatOrder(order),
  })
})
