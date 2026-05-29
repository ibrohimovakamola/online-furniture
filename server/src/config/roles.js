/**
 * Central RBAC definition — single source of truth for roles and permissions.
 * Keep this file in sync with frontend route guards (src/features/auth/permissions.js).
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
}

/** Admin-panel roles only (Customer is blocked from /admin entirely) */
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER]

/**
 * Permission keys map to API routes and admin UI sections.
 * Super Admin receives every permission implicitly in authorize().
 */
export const PERMISSIONS = {
  // Dashboard & analytics (financial data)
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REVENUE: 'view_revenue',

  // Catalog
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CATEGORIES: 'manage_categories',

  // Orders
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',

  // Users (Super Admin only)
  MANAGE_USERS: 'manage_users',
  MANAGE_MANAGERS: 'manage_managers',

  // Storefront
  PLACE_ORDER: 'place_order',
}

/** Role → allowed permissions matrix */
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

export function roleHasPermission(role, permission) {
  if (role === ROLES.SUPER_ADMIN) return true
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
