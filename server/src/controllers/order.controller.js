import Order from '../models/Order.js'
import User from '../models/User.js'
import { ORDER_STATUSES } from '../models/Order.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatOrder } from './checkout.controller.js'
import { buildCreatedAtFilter, parseDateRangeQuery } from '../utils/dateRange.js'

export const listOrders = asyncHandler(async (req, res) => {
  const { search = '' } = req.query
  const dateFilter = buildCreatedAtFilter(parseDateRangeQuery(req.query))

  let orders
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i')
    const customers = await User.find({
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
    }).select('_id')
    orders = await Order.find({
      ...dateFilter,
      $or: [{ orderNumber: regex }, { customer: { $in: customers.map((c) => c._id) } }],
    })
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
  } else {
    orders = await Order.find(dateFilter)
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
  }

  res.json({ success: true, orders: orders.map(formatOrder) })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError('Invalid order status', 400)
  }

  const order = await Order.findById(req.params.id)
  if (!order) throw new AppError('Order not found', 404)

  order.status = status
  order.statusHistory.push({
    status,
    changedBy: req.user._id,
    note: req.body.note || '',
  })

  await order.save()
  await order.populate('customer', 'firstName lastName email')

  res.json({ success: true, order: formatOrder(order) })
})
