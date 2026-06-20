import Order from '../models/Order.js'
import Product from '../models/Product.js'
import B2BInvoice from '../models/B2BInvoice.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatB2BOrder, buildInvoiceHtml } from '../utils/b2bHelpers.js'

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1)
}

/** GET /api/b2b/dashboard/stats */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const profile = req.b2bProfile
  const orders = await Order.find({ customer: req.user._id, isB2B: true }).lean()

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const thisMonth = orders.filter((o) => new Date(o.createdAt) >= startOfMonth())
  const ytdOrders = orders.filter((o) => new Date(o.createdAt) >= startOfYear())
  const pendingDeliveries = orders.filter((o) =>
    ['processing', 'shipped', 'pending'].includes(o.status)
  ).length

  res.json({
    success: true,
    stats: {
      activeOrders: activeOrders.length,
      totalOrders: orders.length,
      monthOrders: thisMonth.length,
      totalSpent,
      monthSpent: thisMonth.reduce((s, o) => s + o.total, 0),
      ytdSpent: ytdOrders.reduce((s, o) => s + o.total, 0),
      pendingDeliveries,
      creditLimit: profile.creditLimit,
      accountBalance: profile.accountBalance,
      creditAvailable: Math.max(profile.creditLimit - profile.accountBalance, 0),
      creditTerms: profile.creditTerms,
      tier: profile.tier,
    },
  })
})

/** GET /api/b2b/dashboard/recent-orders */
export const getDashboardRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50)
  const orders = await Order.find({ customer: req.user._id, isB2B: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  res.json({ success: true, orders: orders.map(formatB2BOrder) })
})

/** GET /api/b2b/dashboard/analytics */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id, isB2B: true }).lean()
  const productCounts = {}

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = String(item.product)
      productCounts[key] = (productCounts[key] || 0) + item.quantity
    }
  }

  const topIds = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const products = await Product.find({ _id: { $in: topIds } }).select('name sku').lean()
  const productMap = Object.fromEntries(products.map((p) => [String(p._id), p]))

  const topProducts = topIds.map((id) => ({
    productId: id,
    name: productMap[id]?.name || 'Unknown',
    sku: productMap[id]?.sku,
    quantityOrdered: productCounts[id],
  }))

  const fulfilled = orders.filter((o) => o.status === 'delivered').length
  const fulfilmentRate = orders.length ? Math.round((fulfilled / orders.length) * 100) : 0

  res.json({
    success: true,
    analytics: {
      topProducts,
      fulfilmentRate,
      repeatOrderRate: orders.length > 1 ? 100 : 0,
      averageOrderValue: orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0,
      lifetimeValue: orders.reduce((s, o) => s + o.total, 0),
    },
  })
})

/** GET /api/b2b/dashboard — legacy combined */
export const getB2BDashboard = asyncHandler(async (req, res) => {
  const profile = req.b2bProfile
  const allOrders = await Order.find({ customer: req.user._id, isB2B: true }).lean()
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
  const activeOrders = allOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status))

  res.json({
    success: true,
    dashboard: {
      profile: profile.toPublicObject(),
      stats: {
        activeOrders: activeOrders.length,
        totalOrders: allOrders.length,
        totalSpent: allOrders.reduce((s, o) => s + o.total, 0),
        creditAvailable: Math.max(profile.creditLimit - profile.accountBalance, 0),
      },
      recentOrders: recentOrders.map(formatB2BOrder),
    },
  })
})

function dueDateFromTerms(terms) {
  const d = new Date()
  if (terms === 'net30') d.setDate(d.getDate() + 30)
  else if (terms === 'net60') d.setDate(d.getDate() + 60)
  else d.setDate(d.getDate() + 7)
  return d
}

/** POST /api/b2b/invoices/generate */
export const generateInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.body
  const order = await Order.findOne({ _id: orderId, customer: req.user._id, isB2B: true })
  if (!order) throw new AppError('Order not found', 404)

  const existing = await B2BInvoice.findOne({ order: order._id })
  if (existing) {
    return res.json({ success: true, invoice: existing, message: 'Invoice already exists' })
  }

  const profile = req.b2bProfile
  const invoice = await B2BInvoice.create({
    invoiceNumber: `INV-B2B-${Date.now()}`,
    order: order._id,
    customer: req.user._id,
    b2bProfile: profile._id,
    companyName: profile.companyName,
    poNumber: order.poNumber,
    lines: order.items.map((i) => ({
      productId: i.product,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    tax: 0,
    total: order.total,
    paymentTerms: profile.creditTerms,
    dueDate: dueDateFromTerms(profile.creditTerms),
    status: 'draft',
  })

  res.status(201).json({ success: true, invoice })
})

/** GET /api/b2b/invoices */
export const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await B2BInvoice.find({ customer: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, invoices })
})

/** GET /api/b2b/invoices/:invoiceId */
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await B2BInvoice.findOne({ _id: req.params.invoiceId, customer: req.user._id })
  if (!invoice) throw new AppError('Invoice not found', 404)
  res.json({ success: true, invoice })
})

/** POST /api/b2b/invoices/:invoiceId/download */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const invoice = await B2BInvoice.findOne({ _id: req.params.invoiceId, customer: req.user._id })
  if (!invoice) throw new AppError('Invoice not found', 404)

  const order = await Order.findById(invoice.order).lean()
  const html = buildInvoiceHtml(invoice, req.b2bProfile, order)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.html"`)
  res.send(html)
})

/** POST /api/b2b/invoices/:invoiceId/email */
export const emailInvoice = asyncHandler(async (req, res) => {
  const invoice = await B2BInvoice.findOne({ _id: req.params.invoiceId, customer: req.user._id })
  if (!invoice) throw new AppError('Invoice not found', 404)

  const to = req.body.email || req.user.email
  invoice.status = 'sent'
  invoice.emailedAt = new Date()
  await invoice.save()

  console.log(`[b2b] Invoice ${invoice.invoiceNumber} queued for email to ${to}`)

  res.json({
    success: true,
    message: `Invoice sent to ${to} (email integration placeholder)`,
    invoice,
  })
})
