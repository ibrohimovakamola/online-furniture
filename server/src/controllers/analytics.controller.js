import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import { ROLES } from '../config/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { formatOrder } from './checkout.controller.js'
import { buildCreatedAtFilter, parseDateRangeQuery } from '../utils/dateRange.js'

function buildTrendPoints(total, points = 7) {
  const value = Number(total) || 0
  if (value === 0) {
    return Array.from({ length: points }, () => ({ value: 0 }))
  }

  const step = Math.max(1, Math.ceil(value / points))
  return Array.from({ length: points }, (_, index) => ({
    value: Math.min(value, step * (index + 1)),
  }))
}

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const dateRange = parseDateRangeQuery(req.query)
  const dateFilter = buildCreatedAtFilter(dateRange)
  const paidMatch = { paymentStatus: 'paid', ...dateFilter }

  const [paidOrders, allOrders, products, customers] = await Promise.all([
    Order.find(paidMatch),
    Order.countDocuments(dateFilter),
    Product.countDocuments({ isPublished: true, ...dateFilter }),
    User.countDocuments({ role: ROLES.CUSTOMER, ...dateFilter }),
  ])

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const itemsSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  )

  const productSales = {}
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = String(item.product)
      productSales[key] = productSales[key] || { name: item.name, quantity: 0, revenue: 0 }
      productSales[key].quantity += item.quantity
      productSales[key].revenue += item.lineTotal
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const statusBreakdown = await Order.aggregate([
    ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  res.json({
    success: true,
    data: {
      totalRevenue,
      orderCount: allOrders,
      itemsSold,
      productCount: products,
      customerCount: customers,
      topProducts: topProducts ?? [],
      statusBreakdown: statusBreakdown ?? [],
    },
  })
})

export const getRevenueAnalytics = asyncHandler(async (_req, res) => {
  const paidOrders = await Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 })
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)

  res.json({
    success: true,
    data: {
      totalRevenue,
      orderCount: paidOrders.length,
      topProducts: [],
    },
  })
})

export const getDashboardStats = asyncHandler(async (req, res) => {
  const dateRange = parseDateRangeQuery(req.query)
  const dateFilter = buildCreatedAtFilter(dateRange)
  const paidMatch = { paymentStatus: 'paid', ...dateFilter }

  const [productCount, orderCount, customers, revenueAgg, recentOrderDocs, categories] =
    await Promise.all([
      Product.countDocuments(dateFilter),
      Order.countDocuments(dateFilter),
      User.countDocuments({ role: ROLES.CUSTOMER, ...dateFilter }),
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find(dateFilter)
        .populate('customer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5),
      Category.find().select('name').lean(),
    ])

  const revenue = revenueAgg[0]?.total || 0

  const salesByCategory = await Promise.all(
    (categories ?? []).map(async (category) => ({
      name: category.name,
      value: await Product.countDocuments({ category: category._id, ...dateFilter }),
    }))
  )

  const recentOrders = (recentOrderDocs ?? []).map(formatOrder)

  res.json({
    success: true,
    data: {
      products: productCount ?? 0,
      orders: orderCount ?? 0,
      users: customers ?? 0,
      revenue,
      recentOrders,
      salesByCategory: salesByCategory ?? [],
      trends: {
        products: buildTrendPoints(productCount),
        orders: buildTrendPoints(orderCount),
        revenue: buildTrendPoints(revenue),
        users: buildTrendPoints(customers),
      },
      dateRange: dateRange || 'all',
    },
  })
})
