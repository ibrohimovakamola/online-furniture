import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrderPayableAmount } from '../utils/orderAmount.js'

const NOT_DELETED = { isDeleted: { $ne: true } }
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5

function sumRevenue(orders) {
  return orders.reduce((sum, o) => sum + getOrderPayableAmount(o), 0)
}

/** GET /api/admin/statistics */
export const getAdminStatistics = asyncHandler(async (_req, res) => {
  const paidMatch = { paymentStatus: 'paid', ...NOT_DELETED }

  const [totalProducts, totalOrders, totalUsers, paidOrders, pendingOrders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(NOT_DELETED),
    User.countDocuments({ role: { $in: [ROLES.CUSTOMER, ROLES.B2B_PARTNER] } }),
    Order.find(paidMatch).select('total finalPrice subtotal').lean(),
    Order.countDocuments({ status: 'pending', ...NOT_DELETED }),
  ])

  const totalRevenue = sumRevenue(paidOrders)

  res.json({
    success: true,
    data: {
      totalSales: paidOrders.length,
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      pendingOrders,
      averageOrderValue: paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0,
    },
  })
})

/** GET /api/admin/statistics/daily — revenue by day, last 30 days */
export const getDailyStatistics = asyncHandler(async (_req, res) => {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  since.setHours(0, 0, 0, 0)

  const rows = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        isDeleted: { $ne: true },
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: { $ifNull: ['$finalPrice', '$total'] } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const byDay = Object.fromEntries(rows.map((r) => [r._id, { revenue: r.revenue, orders: r.orders }]))
  const daily = []

  for (let i = 0; i < 30; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    daily.push({
      date: key,
      revenue: byDay[key]?.revenue || 0,
      orders: byDay[key]?.orders || 0,
    })
  }

  res.json({
    success: true,
    data: { daily, periodDays: 30 },
  })
})

/** GET /api/admin/statistics/products — best sellers + low stock */
export const getProductStatistics = asyncHandler(async (_req, res) => {
  const paidOrders = await Order.find({ paymentStatus: 'paid', ...NOT_DELETED })
    .select('items')
    .lean()

  const salesMap = {}
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const id = String(item.product || item.productId)
      if (!salesMap[id]) {
        salesMap[id] = {
          productId: id,
          name: item.name,
          quantitySold: 0,
          revenue: 0,
        }
      }
      salesMap[id].quantitySold += item.quantity
      salesMap[id].revenue += item.lineTotal || item.subtotal || 0
    })
  })

  const bestSellers = Object.values(salesMap)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10)

  const lowStockItems = await Product.find({
    stock: { $lte: LOW_STOCK_THRESHOLD },
    isPublished: { $ne: false },
  })
    .select('name name_uz sku stock basePrice price slug')
    .sort({ stock: 1 })
    .limit(20)
    .lean()

  res.json({
    success: true,
    data: {
      bestSellers,
      lowStockItems: lowStockItems.map((p) => ({
        id: p._id,
        name: p.name_uz || p.name,
        sku: p.sku,
        stock: p.stock,
        price: p.price ?? p.basePrice,
        slug: p.slug,
      })),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
  })
})

/** GET /api/admin/statistics/users — new users + returning customers */
export const getUserStatistics = asyncHandler(async (_req, res) => {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [newUsers, orderStats] = await Promise.all([
    User.countDocuments({
      role: ROLES.CUSTOMER,
      createdAt: { $gte: since },
    }),
    Order.aggregate([
      {
        $match: {
          customer: { $ne: null },
          paymentStatus: 'paid',
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$finalPrice', '$total'] } },
        },
      },
    ]),
  ])

  const returningCustomers = orderStats.filter((s) => s.orderCount > 1).length
  const oneTimeCustomers = orderStats.filter((s) => s.orderCount === 1).length
  const topCustomers = orderStats
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map((s) => ({
      userId: s._id,
      orderCount: s.orderCount,
      totalSpent: s.totalSpent,
    }))

  res.json({
    success: true,
    data: {
      newUsersLast30Days: newUsers,
      returningCustomers,
      oneTimeCustomers,
      totalCustomersWithOrders: orderStats.length,
      topCustomers,
    },
  })
})
