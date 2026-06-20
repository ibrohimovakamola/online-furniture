import { Router } from 'express'
import { protect, requireAdminPanelAccess, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { productUpload, categoryUpload } from '../middleware/upload.js'
import { withMulter } from '../middleware/multerError.js'
import { validateRequest } from '../middleware/validate.js'
import {
  adminListQuerySchema,
  updateUserRoleSchema,
  updateProductStockSchema,
  bulkUpdateProductSchema,
} from '../validators/admin.schemas.js'
import { updateOrderStatusSchema, updatePaymentStatusSchema } from '../validators/order.schemas.js'
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  updateProductStock, bulkUpdateProduct,
} from '../controllers/product.controller.js'
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/category.controller.js'
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPaymentStatus,
  softDeleteOrder,
  exportOrdersCsv,
  recordInstallmentPayment,
} from '../controllers/order.controller.js'
import {
  listAdminUsers,
  getAdminUser,
  updateAdminUserRole,
  deactivateAdminUser,
  getAdminUserOrders,
} from '../controllers/adminUser.controller.js'
import {
  getAdminStatistics,
  getDailyStatistics,
  getProductStatistics,
  getUserStatistics,
} from '../controllers/adminStatistics.controller.js'
import {
  listCustomers,
  toggleCustomerBlock,
  updateCustomerRole,
} from '../controllers/customer.controller.js'
import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getDashboardStats,
  getSalesAnalytics,
  getUsersAnalytics,
  getProductsAnalytics,
  getTrafficAnalytics,
  exportAnalyticsCsv,
} from '../controllers/analytics.controller.js'
import { listErrorLogs, deleteErrorLog } from '../controllers/errorLog.controller.js'
import { getAdminSettings, updateAdminSettings } from '../controllers/settings.controller.js'
import {
  getAdminFlashSale,
  updateFlashSaleConfig,
  updateFlashSaleProducts,
} from '../controllers/flashSale.controller.js'
import { settingsUpload } from '../middleware/upload.js'
import { b2bAdminRouter, b2bUsersAdminRouter } from '../routes/b2b.routes.js'
import {
  listAdminPosts,
  getAdminPost,
  createAdminPost,
  updateAdminPost,
  patchAdminPostStatus,
  deleteAdminPost,
  bulkDeleteAdminPosts,
  getBlogAnalytics,
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from '../controllers/blogAdmin.controller.js'
import { blogUpload } from '../middleware/upload.js'
import {
  listAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/faq.controller.js'
import { galleryImageUpload } from '../middleware/upload.js'
import {
  listAdminGallery,
  uploadGalleryItem,
  updateGalleryItem,
  replaceGalleryImage,
  deleteGalleryItem,
} from '../controllers/gallery.controller.js'
import {
  listAdminPages,
  getAdminPageByName,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/page.controller.js'
import {
  listAdminReviews,
  approveReview,
  adminDeleteReview,
} from '../controllers/review.controller.js'
import { adminReviewListQuerySchema } from '../validators/review.schemas.js'

const router = Router()
const listQuery = validateRequest(adminListQuerySchema, { source: 'query' })

/** All admin routes require JWT + admin panel access (super_admin | manager) */
router.use(protect, requireAdminPanelAccess)

/** Dashboard stats (legacy) */
/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', getDashboardStats)

/** Statistics — /api/admin/statistics/* */
router.get('/statistics', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getAdminStatistics)
router.get('/statistics/daily', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getDailyStatistics)
router.get('/statistics/products', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getProductStatistics)
router.get('/statistics/users', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getUserStatistics)

/** Analytics (legacy) */
/** Analytics — /api/admin/analytics/* */
router.get('/analytics/overview', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getAnalyticsOverview)
router.get('/analytics/sales', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getSalesAnalytics)
router.get('/analytics/users', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getUsersAnalytics)
router.get('/analytics/products', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getProductsAnalytics)
router.get('/analytics/traffic', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), getTrafficAnalytics)
router.get('/analytics/export', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), exportAnalyticsCsv)
router.get('/analytics/revenue', authorizePermission(PERMISSIONS.VIEW_REVENUE), getRevenueAnalytics)

/** Error tracking — /api/admin/errors */
router.get('/errors', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), listErrorLogs)
router.delete('/errors/:errorId', authorizePermission(PERMISSIONS.VIEW_ANALYTICS), deleteErrorLog)

/** Products CRUD */
router.get('/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), listQuery, listProducts)
router.post('/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), withMulter(productUpload), createProduct)
router.put(
  '/products/:productId/stock',
  authorizePermission(PERMISSIONS.MANAGE_PRODUCTS),
  validateRequest(updateProductStockSchema),
  updateProductStock
)
router.post(
  '/products/:productId/bulk-update',
  authorizePermission(PERMISSIONS.MANAGE_PRODUCTS),
  validateRequest(bulkUpdateProductSchema),
  bulkUpdateProduct
)
router.get('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), getProduct)
router.put('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), withMulter(productUpload), updateProduct)
router.delete('/products/:id', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), deleteProduct)

/** Categories — list readable by any admin (product form dropdown) */
router.get('/categories', listQuery, listCategories)
router.post('/categories', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), withMulter(categoryUpload), createCategory)
router.put('/categories/:id', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), withMulter(categoryUpload), updateCategory)
router.delete('/categories/:id', authorizePermission(PERMISSIONS.MANAGE_CATEGORIES), deleteCategory)

/** Orders — export before :orderId */
router.get('/orders/export', authorizePermission(PERMISSIONS.VIEW_ORDERS), listQuery, exportOrdersCsv)
router.get('/orders', authorizePermission(PERMISSIONS.VIEW_ORDERS), listQuery, listOrders)
router.get('/orders/:orderId', authorizePermission(PERMISSIONS.VIEW_ORDERS), getOrderById)
router.put(
  '/orders/:orderId/status',
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus
)
router.put(
  '/orders/:orderId/payment-status',
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  validateRequest(updatePaymentStatusSchema),
  updateOrderPaymentStatus
)
router.patch(
  '/orders/:id/status',
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus
)
router.delete(
  '/orders/:orderId',
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  softDeleteOrder
)
router.patch(
  '/orders/:id/installment-payment',
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  recordInstallmentPayment
)

/** Users management */
router.get('/users', authorizePermission(PERMISSIONS.MANAGE_USERS), listQuery, listAdminUsers)
router.get('/users/:userId/orders', authorizePermission(PERMISSIONS.MANAGE_USERS), listQuery, getAdminUserOrders)
router.get('/users/:userId', authorizePermission(PERMISSIONS.MANAGE_USERS), getAdminUser)
router.put(
  '/users/:userId/role',
  authorizePermission(PERMISSIONS.MANAGE_USERS),
  validateRequest(updateUserRoleSchema),
  updateAdminUserRole
)
router.delete('/users/:userId', authorizePermission(PERMISSIONS.MANAGE_USERS), deactivateAdminUser)

/** Flash sale */
router.get('/flash-sale', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), getAdminFlashSale)
router.put('/flash-sale/config', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), updateFlashSaleConfig)
router.put('/flash-sale/products', authorizePermission(PERMISSIONS.MANAGE_PRODUCTS), updateFlashSaleProducts)

/** Customers (legacy — super admin) */
router.get('/customers', authorizePermission(PERMISSIONS.MANAGE_USERS), listCustomers)
router.patch('/customers/:id/toggle-block', authorizePermission(PERMISSIONS.MANAGE_USERS), toggleCustomerBlock)
router.patch('/customers/:id/role', authorizePermission(PERMISSIONS.MANAGE_USERS), updateCustomerRole)

/** Site settings (super admin) */
router.get('/settings', authorizePermission(PERMISSIONS.MANAGE_USERS), getAdminSettings)
router.put('/settings', authorizePermission(PERMISSIONS.MANAGE_USERS), withMulter(settingsUpload), updateAdminSettings)

/** B2B partner applications (legacy) */
router.use('/b2b', b2bAdminRouter)

/** B2B user management */
router.use('/b2b-users', b2bUsersAdminRouter)

/** Blog management */
router.get('/blog/posts', authorizePermission(PERMISSIONS.MANAGE_BLOG), listAdminPosts)
router.get('/blog/posts/:id', authorizePermission(PERMISSIONS.MANAGE_BLOG), getAdminPost)
router.post('/blog/posts', authorizePermission(PERMISSIONS.MANAGE_BLOG), withMulter(blogUpload), createAdminPost)
router.put('/blog/posts/:id', authorizePermission(PERMISSIONS.MANAGE_BLOG), withMulter(blogUpload), updateAdminPost)
router.patch('/blog/posts/:id/status', authorizePermission(PERMISSIONS.MANAGE_BLOG), patchAdminPostStatus)
router.delete('/blog/posts/:id', authorizePermission(PERMISSIONS.MANAGE_BLOG), deleteAdminPost)
router.post('/blog/posts/bulk-delete', authorizePermission(PERMISSIONS.MANAGE_BLOG), bulkDeleteAdminPosts)
router.get('/blog/analytics', authorizePermission(PERMISSIONS.MANAGE_BLOG), getBlogAnalytics)

router.get('/blog/categories', authorizePermission(PERMISSIONS.MANAGE_BLOG), listBlogCategories)
router.post('/blog/categories', authorizePermission(PERMISSIONS.MANAGE_BLOG), withMulter(blogUpload), createBlogCategory)
router.put('/blog/categories/:id', authorizePermission(PERMISSIONS.MANAGE_BLOG), withMulter(blogUpload), updateBlogCategory)
router.delete('/blog/categories/:id', authorizePermission(PERMISSIONS.MANAGE_BLOG), deleteBlogCategory)

/** Product reviews moderation */
router.get(
  '/reviews',
  validateRequest(adminReviewListQuerySchema, { source: 'query' }),
  listAdminReviews
)
router.put('/reviews/:reviewId/approve', approveReview)
router.delete('/reviews/:reviewId', adminDeleteReview)

/** FAQ CMS */
router.get('/faq', listAdminFaqs)
router.post('/faq', createFaq)
router.put('/faq/:id', updateFaq)
router.delete('/faq/:id', deleteFaq)

/** CMS pages — /api/admin/pages/:pageName */
router.get('/pages', listQuery, listAdminPages)
router.get('/pages/:pageName', getAdminPageByName)
router.post('/pages', createPage)
router.put('/pages/:pageName', updatePage)
router.delete('/pages/:pageName', deletePage)

/** Gallery — Cloudinary + MongoDB */
router.get('/gallery', listAdminGallery)
router.post('/gallery/upload', withMulter(galleryImageUpload), uploadGalleryItem)
router.put('/gallery/:id', updateGalleryItem)
router.put('/gallery/:id/image', withMulter(galleryImageUpload), replaceGalleryImage)
router.delete('/gallery/:id', deleteGalleryItem)

export default router
