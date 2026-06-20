import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import ActivityLog from '../models/ActivityLog.js'
import { ROLES } from '../config/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { formatOrder } from '../utils/formatOrder.js'
import { parseDateRangeQuery, buildCreatedAtFilter } from '../utils/dateRange.js'
import {
  parseAnalyticsDateRange,
  buildDateWindowFilter,
  dateGroupExpression,
  getOrderPayableTotal,
} from '../utils/analyticsDateRange.js'
import { ACTIONS } from '../utils/activityLogger.js'

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

async function getTopProductsFromOrders(dateFilter, limit = 5) {
  const paidOrders = await Order.find({ paymentStatus: 'paid', ...dateFilter }).lean()
  const productSales = {}

  for (const order of paidOrders) {
    for (const item of order.items || []) {
      const key = String(item.product)
      if (!productSales[key]) {
        productSales[key] = { name: item.name, sales: 0, revenue: 0 }
      }
      productSales[key].sales += item.quantity
      productSales[key].revenue += item.lineTotal || 0
    }
  }

  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

async function computeConversionRate(dateFilter) {
  const [views, paidOrders] = await Promise.all([
    ActivityLog.countDocuments({
      action: ACTIONS.VIEWED_PRODUCT,
      ...dateFilter,
    }),
    Order.countDocuments({ paymentStatus: 'paid', ...dateFilter }),
  ])
  if (!views) return 0
  return Math.round((paidOrders / views) * 1000) / 10
}

function analyticsPeriodResponse(range, metrics, extra = {}) {
  return {
    success: true,
    data: {
      period: range.label,
      startDate: range.start.getTime() === 0 ? null : range.start.toISOString().slice(0, 10),
      endDate: range.end.toISOString().slice(0, 10),
      groupBy: range.groupBy,
      metrics,
      ...extra,
    },
  }
}

/** GET /api/admin/analytics/overview */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const paidMatch = { paymentStatus: 'paid', ...dateFilter }

  const [paidOrders, orderCount, newUsers, topProducts, conversionRate] = await Promise.all([
    Order.find(paidMatch).lean(),
    Order.countDocuments(dateFilter),
    User.countDocuments({ role: ROLES.CUSTOMER, ...dateFilter }),
    getTopProductsFromOrders(dateFilter),
    computeConversionRate(dateFilter),
  ])

  const totalRevenue = paidOrders.reduce((sum, o) => sum + getOrderPayableTotal(o), 0)
  const paidCount = paidOrders.length
  const averageOrderValue = paidCount ? Math.round(totalRevenue / paidCount) : 0

  res.json(
    analyticsPeriodResponse(range, {
      totalRevenue,
      totalOrders: orderCount,
      paidOrders: paidCount,
      newUsers,
      averageOrderValue,
      conversionRate,
      topProducts,
    })
  )
})

/** GET /api/admin/analytics/sales */
export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const paidMatch = { paymentStatus: 'paid', ...dateFilter }
  const dateExpr = dateGroupExpression(range.groupBy)

  const [byDate, byCategory, byProduct, paidOrders] = await Promise.all([
    Order.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: dateExpr,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$categoryDoc.name_uz', { $ifNull: ['$categoryDoc.name', 'Uncategorized'] }] },
          revenue: { $sum: '$items.lineTotal' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sales: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
    ]),
    Order.find(paidMatch).lean(),
  ])

  const totalRevenue = paidOrders.reduce((sum, o) => sum + getOrderPayableTotal(o), 0)

  res.json(
    analyticsPeriodResponse(
      range,
      {
        totalRevenue,
        totalOrders: paidOrders.length,
        byDate: byDate.map((row) => ({
          date: row._id,
          revenue: row.revenue,
          orders: row.orders,
        })),
        byCategory: byCategory.map((row) => ({
          category: row._id,
          revenue: row.revenue,
          quantity: row.quantity,
        })),
        byProduct: byProduct.map((row) => ({
          productId: String(row._id),
          name: row.name,
          sales: row.sales,
          revenue: row.revenue,
        })),
      }
    )
  )
})

/** GET /api/admin/analytics/users */
export const getUsersAnalytics = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const dateExpr = dateGroupExpression(range.groupBy)

  const [newUsersByDate, newUsers, activeUsers, repeatCustomers] = await Promise.all([
    User.aggregate([
      { $match: { role: ROLES.CUSTOMER, ...dateFilter } },
      { $group: { _id: dateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ role: ROLES.CUSTOMER, ...dateFilter }),
    ActivityLog.distinct('userId', {
      type: 'login',
      userId: { $ne: null },
      ...dateFilter,
    }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', customer: { $ne: null }, ...dateFilter } },
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'total' },
    ]),
  ])

  res.json(
    analyticsPeriodResponse(range, {
      newUsers,
      activeUsers: activeUsers.length,
      repeatCustomers: repeatCustomers[0]?.total || 0,
      newUsersByDate: newUsersByDate.map((row) => ({
        date: row._id,
        count: row.count,
      })),
    })
  )
})

/** GET /api/admin/analytics/products */
export const getProductsAnalytics = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)

  const [viewLogs, purchaseLogs, topViewed] = await Promise.all([
    ActivityLog.countDocuments({ action: ACTIONS.VIEWED_PRODUCT, ...dateFilter }),
    ActivityLog.countDocuments({ action: ACTIONS.PAYMENT_COMPLETED, ...dateFilter }),
    ActivityLog.aggregate([
      { $match: { action: ACTIONS.VIEWED_PRODUCT, productId: { $ne: null }, ...dateFilter } },
      { $group: { _id: '$productId', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    ]),
  ])

  const conversionRate =
    viewLogs > 0 ? Math.round((purchaseLogs / viewLogs) * 1000) / 10 : 0

  res.json(
    analyticsPeriodResponse(range, {
      totalViews: viewLogs,
      totalPurchases: purchaseLogs,
      conversionRate,
      topProducts: topViewed.map((row) => ({
        productId: String(row._id),
        name: row.product?.name_uz || row.product?.name || 'Unknown',
        views: row.views,
        sales: row.product?.salesCount || 0,
      })),
    })
  )
})

/** GET /api/admin/analytics/traffic */
export const getTrafficAnalytics = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const dateExpr = dateGroupExpression(range.groupBy)

  const [pageViewsByDate, totalPageViews, sources, topPaths] = await Promise.all([
    ActivityLog.aggregate([
      { $match: { type: 'view', ...dateFilter } },
      { $group: { _id: dateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    ActivityLog.countDocuments({ type: 'view', ...dateFilter }),
    ActivityLog.aggregate([
      { $match: { type: 'view', ...dateFilter } },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [{ $ne: ['$details.referrer', ''] }, { $ne: ['$details.referrer', null] }] },
              '$details.referrer',
              'direct',
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    ActivityLog.aggregate([
      { $match: { type: 'view', ...dateFilter } },
      {
        $group: {
          _id: { $ifNull: ['$details.path', '$action'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
  ])

  res.json(
    analyticsPeriodResponse(range, {
      totalPageViews,
      pageViewsByDate: pageViewsByDate.map((row) => ({
        date: row._id,
        views: row.count,
      })),
      trafficSources: sources.map((row) => ({
        source: row._id,
        views: row.count,
      })),
      topPaths: topPaths.map((row) => ({
        path: row._id,
        views: row.count,
      })),
    })
  )
})

/** GET /api/admin/analytics/export?type=overview|sales|orders */
export const exportAnalyticsCsv = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const exportType = String(req.query.type || 'orders').toLowerCase()

  let csv = ''
  let filename = 'analytics-export.csv'

  if (exportType === 'sales') {
    const paidMatch = { paymentStatus: 'paid', ...dateFilter }
    const rows = await Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sales: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
    ])
    csv = 'productId,name,sales,revenue\n'
    csv += rows
      .map((r) => `${r._id},"${String(r.name).replace(/"/g, '""')}",${r.sales},${r.revenue}`)
      .join('\n')
    filename = `sales-${range.start.toISOString().slice(0, 10)}.csv`
  } else if (exportType === 'activity') {
    const logs = await ActivityLog.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean()
    csv = 'createdAt,type,action,userId,productId,orderId,ipAddress\n'
    csv += logs
      .map((l) =>
        [
          l.createdAt?.toISOString(),
          l.type,
          l.action,
          l.userId || '',
          l.productId || '',
          l.orderId || '',
          l.ipAddress || '',
        ].join(',')
      )
      .join('\n')
    filename = `activity-${range.start.toISOString().slice(0, 10)}.csv`
  } else {
    const orders = await Order.find(dateFilter)
      .populate('customer', 'email')
      .sort({ createdAt: -1 })
      .lean()
    csv = 'orderNumber,createdAt,status,paymentStatus,total,customerEmail\n'
    csv += orders
      .map((o) =>
        [
          o.orderNumber,
          o.createdAt?.toISOString(),
          o.status,
          o.paymentStatus,
          getOrderPayableTotal(o),
          o.customer?.email || o.guest?.email || '',
        ].join(',')
      )
      .join('\n')
    filename = `orders-${range.start.toISOString().slice(0, 10)}.csv`
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
})

/** Legacy revenue endpoint */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const range = parseAnalyticsDateRange(req.query)
  const dateFilter = buildDateWindowFilter(range)
  const paidOrders = await Order.find({ paymentStatus: 'paid', ...dateFilter }).lean()
  const totalRevenue = paidOrders.reduce((sum, o) => sum + getOrderPayableTotal(o), 0)
  const topProducts = await getTopProductsFromOrders(dateFilter)

  res.json({
    success: true,
    data: {
      period: range.label,
      totalRevenue,
      orderCount: paidOrders.length,
      topProducts,
    },
  })
})

/** Legacy dashboard stats */
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
