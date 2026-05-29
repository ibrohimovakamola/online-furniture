/**
 * Frontend mirror of server/src/config/roles.js
 * Keep permission keys identical so UI guards match API middleware.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
}

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER]

export const PERMISSIONS = {
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REVENUE: 'view_revenue',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  MANAGE_USERS: 'manage_users',
  MANAGE_MANAGERS: 'manage_managers',
  PLACE_ORDER: 'place_order',
}

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
  ],
  [ROLES.CUSTOMER]: [PERMISSIONS.PLACE_ORDER],
}

/** Admin sidebar routes → required permission (null = any admin) */
export const ADMIN_ROUTE_PERMISSIONS = {
  '/admin': null,
  '/admin/products': PERMISSIONS.MANAGE_PRODUCTS,
  '/admin/categories': PERMISSIONS.MANAGE_CATEGORIES,
  '/admin/orders': PERMISSIONS.VIEW_ORDERS,
  '/admin/customers': PERMISSIONS.MANAGE_USERS,
  '/admin/flash-sale': PERMISSIONS.MANAGE_PRODUCTS,
  '/admin/analytics': PERMISSIONS.VIEW_ANALYTICS,
  '/admin/settings': PERMISSIONS.MANAGE_USERS,
}

export function roleHasPermission(role, permission) {
  if (role === ROLES.SUPER_ADMIN) return true
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role)
}

export function canAccessAdminRoute(role, path) {
  if (!isAdminRole(role)) return false

  const normalized = path.replace(/\/$/, '') || '/admin'
  const permission = ADMIN_ROUTE_PERMISSIONS[normalized]

  if (permission === undefined) return true
  if (permission === null) return true

  return roleHasPermission(role, permission)
}
