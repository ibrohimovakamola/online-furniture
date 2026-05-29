import User from '../models/User.js'
import Order from '../models/Order.js'
import { ROLES } from '../config/roles.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'

const LISTABLE_ROLES = [ROLES.CUSTOMER, ROLES.MANAGER]

function formatCustomer(u, statsMap) {
  const stats = statsMap[String(u._id)] || { totalOrders: 0, totalSpent: 0 }
  return {
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    address: u.address || '',
    role: u.role,
    isActive: u.isActive,
    isBlocked: !u.isActive,
    totalOrders: stats.totalOrders,
    totalSpent: stats.totalSpent,
    createdAt: u.createdAt,
    initials: `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || '?',
  }
}

export const listCustomers = asyncHandler(async (req, res) => {
  const { search = '' } = req.query
  const filter = { role: { $in: LISTABLE_ROLES } }

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i')
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }]
  }

  const users = await User.find(filter).sort({ createdAt: -1 })
  const orderCounts = await Order.aggregate([
    { $group: { _id: '$customer', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
  ])
  const statsMap = Object.fromEntries(
    orderCounts.map((o) => [String(o._id), { totalOrders: o.totalOrders, totalSpent: o.totalSpent }])
  )

  res.json({
    success: true,
    customers: users.map((u) => formatCustomer(u, statsMap)),
  })
})

export const toggleCustomerBlock = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: { $in: LISTABLE_ROLES } })
  if (!user) throw new AppError('User not found', 404)

  user.isActive = !user.isActive
  await user.save()

  res.json({
    success: true,
    message: user.isActive ? 'User unblocked' : 'User blocked',
    customer: {
      id: user._id,
      isActive: user.isActive,
      isBlocked: !user.isActive,
    },
  })
})

export const updateCustomerRole = asyncHandler(async (req, res) => {
  const { role } = req.body
  if (![ROLES.CUSTOMER, ROLES.MANAGER].includes(role)) {
    throw new AppError('Role must be customer or manager', 400)
  }

  const user = await User.findOne({ _id: req.params.id, role: { $in: LISTABLE_ROLES } })
  if (!user) throw new AppError('User not found', 404)

  user.role = role
  await user.save()

  const orderStats = await Order.aggregate([
    { $match: { customer: user._id } },
    { $group: { _id: '$customer', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
  ])
  const statsMap = Object.fromEntries(
    orderStats.map((o) => [String(o._id), { totalOrders: o.totalOrders, totalSpent: o.totalSpent }])
  )

  res.json({
    success: true,
    message: 'User role updated',
    customer: formatCustomer(user, statsMap),
  })
})
