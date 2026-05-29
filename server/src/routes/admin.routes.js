import { Router } from 'express'
import { protect, requireAdminPanelAccess, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { productUpload, categoryUpload } from '../middleware/upload.js'
import { withMulter } from '../middleware/multerError.js'
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from '../controllers/product.controller.js'
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/category.controller.js'
import { listOrders, updateOrderStatus } from '../controllers/order.controller.js'
import {
  listCustomers,
  toggleCustomerBlock,
  updateCustomerRole,
} from '../controllers/customer.controller.js'
import {
  getAnalyticsOverview, getRevenueAnalytics, getDashboardStats,
} from '../controllers/analytics.controller.js'
import { getAdminSettings, updateAdminSettings } from '../controllers/settings.controller.js'
import {
  getAdminFlashSale,
  updateFlashSaleConfig,
  updateFlashSaleProducts,
} from '../controllers/flashSale.controller.js'
import { settingsUpload } from '../middleware/upload.js'

const router = Router()

/** All admin routes require JWT + admin panel access (super_admin | manager) */
router.use(protect, requireAdminPanelAccess)

/** Dashboard stats */
router.get('/dashboard/stats', getDashboardStats)

/** Analytics */
router.get('/analytics/overview', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getAnalyticsOverview)
router.get('/analytics/revenue', authorizePermission(PERMISSIONS.VIEW_REVENUE), getRevenueAnalytics)

/** Products CRUD */
router.get('/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), listProducts)
router.get('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), getProduct)
router.post('/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), withMulter(productUpload), createProduct)
router.put('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), withMulter(productUpload), updateProduct)
router.delete('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), deleteProduct)

/** Categories — list readable by any admin (product form dropdown) */
router.get('/categories', listCategories)
router.post('/categories', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), withMulter(categoryUpload), createCategory)
router.put('/categories/:id', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), withMulter(categoryUpload), updateCategory)
router.delete('/categories/:id', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), deleteCategory)

/** Orders */
router.get('/orders', authorizePermission(PERMISSIONS.VIEW_ORDERS), listOrders)
router.patch('/orders/:id/status', authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS), updateOrderStatus)

/** Flash sale */
router.get('/flash-sale', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), getAdminFlashSale)
router.put('/flash-sale/config', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), updateFlashSaleConfig)
router.put('/flash-sale/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), updateFlashSaleProducts)

/** Customers (super admin) */
router.get('/customers', authorizePermission(PERMISSIONS.MANAGE_USERS), listCustomers)
router.patch('/customers/:id/toggle-block', authorizePermission(PERMISSIONS.MANAGE_USERS), toggleCustomerBlock)
router.patch('/customers/:id/role', authorizePermission(PERMISSIONS.MANAGE_USERS), updateCustomerRole)

/** Site settings (super admin) */
router.get('/settings', authorizePermission(PERMISSIONS.MANAGE_USERS), getAdminSettings)
router.put('/settings', authorizePermission(PERMISSIONS.MANAGE_USERS), withMulter(settingsUpload), updateAdminSettings)

export default router
