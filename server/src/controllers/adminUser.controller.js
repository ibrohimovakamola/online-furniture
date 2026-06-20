import User from '../models/User.js'
import Order from '../models/Order.js'
import { ROLES } from '../config/roles.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatOrder } from '../utils/formatOrder.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'
import { logAdminAction } from '../utils/adminActionLog.js'
import { buildSearchRegex } from '../utils/safeRegex.js'

const NOT_DELETED = { isDeleted: { $ne: true } }

function formatAdminUser(user, stats = {}) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role,
    isActive: user.isActive,
    totalOrders: stats.totalOrders || 0,
    totalSpent: stats.totalSpent || 0,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}

async function loadUserStats(userIds) {
  if (!userIds.length) return {}
  const rows = await Order.aggregate([
    { $match: { customer: { $in: userIds }, ...NOT_DELETED } },
    {
      $group: {
        _id: '$customer',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: { $ifNull: ['$finalPrice', '$total'] } },
      },
    },
  ])
  return Object.fromEntries(
    rows.map((r) => [String(r._id), { totalOrders: r.totalOrders, totalSpent: r.totalSpent }])
  )
}

/** GET /api/admin/users */
export const listAdminUsers = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const { limit, page, skip } = parsePagination(q)
  const filter = {}

  if (q.role) filter.role = q.role
  if (q.isActive !== undefined) filter.isActive = q.isActive
  if (q.search?.trim()) {
    const regex = buildSearchRegex(q.search)
    if (regex) {
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }]
    }
  }

  const sort = q.sortBy === 'email' ? { email: 1 } : { createdAt: -1 }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  const statsMap = await loadUserStats(users.map((u) => u._id))
  const items = users.map((u) => formatAdminUser(u, statsMap[String(u._id)]))

  res.json(buildPaginatedResponse(items, { total, page, limit }))
})

/** GET /api/admin/users/:userId */
export const getAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId || req.params.id)
  if (!user) throw new AppError('User not found', 404)

  const statsMap = await loadUserStats([user._id])

  res.json({
    success: true,
    data: { user: formatAdminUser(user, statsMap[String(user._id)]) },
  })
})

/** PUT /api/admin/users/:userId/role */
export const updateAdminUserRole = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const targetId = req.params.userId || req.params.id

  if (String(targetId) === String(req.user._id)) {
    throw new AppError('You cannot change your own role', 400)
  }

  const user = await User.findById(targetId)
  if (!user) throw new AppError('User not found', 404)

  if (user.role === ROLES.SUPER_ADMIN) {
    throw new AppError('Cannot change super admin role via this endpoint', 403)
  }

  user.role = body.role
  await user.save()

  logAdminAction(req, 'user.role_update', { targetUserId: String(user._id), role: body.role })

  res.json({
    success: true,
    message: 'User role updated',
    data: { user: formatAdminUser(user) },
  })
})

/** DELETE /api/admin/users/:userId — deactivate (soft) */
export const deactivateAdminUser = asyncHandler(async (req, res) => {
  const targetId = req.params.userId || req.params.id

  if (String(targetId) === String(req.user._id)) {
    throw new AppError('You cannot deactivate your own account', 400)
  }

  const user = await User.findById(targetId)
  if (!user) throw new AppError('User not found', 404)

  if (user.role === ROLES.SUPER_ADMIN) {
    throw new AppError('Cannot deactivate a super admin account', 403)
  }

  user.isActive = false
  await user.save()

  logAdminAction(req, 'user.deactivate', { targetUserId: String(user._id) })

  res.json({
    success: true,
    message: 'User deactivated',
    data: { user: formatAdminUser(user) },
  })
})

/** GET /api/admin/users/:userId/orders */
export const getAdminUserOrders = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.params.id
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found', 404)

  const q = req.validated || req.query
  const { limit, page, skip } = parsePagination(q)
  const filter = { customer: user._id, ...NOT_DELETED }

  if (q.status) filter.status = q.status

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ])

  res.json(
    buildPaginatedResponse(orders.map(formatOrder), { total, page, limit })
  )
})
