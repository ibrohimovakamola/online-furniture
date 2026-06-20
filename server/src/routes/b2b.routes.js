import { Router } from 'express'
import { protect, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { withMulter } from '../middleware/multerError.js'
import { b2bDocumentUpload, b2bRegistrationUpload } from '../middleware/upload.js'
import { requireB2BVerified } from '../middleware/requireB2B.js'
import { registerB2BPartner } from '../controllers/b2b.controller.js'
import {
  getMyB2BProfile,
  uploadB2BLicense,
  getB2BAccount,
  updateB2BAccount,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateAccountSettings,
} from '../controllers/b2b.account.controller.js'
import {
  listB2BProducts,
  getB2BProduct,
  getB2BProductPricing,
  calculateBulkPrice,
  listB2BFavorites,
  addB2BFavorite,
  removeB2BFavorite,
} from '../controllers/b2b.products.controller.js'
import {
  createB2BOrder,
  listB2BOrders,
  getB2BOrder,
  updateB2BOrder,
  cancelB2BOrder,
  reorderB2BOrder,
} from '../controllers/b2b.orders.controller.js'
import {
  getDashboardStats,
  getDashboardRecentOrders,
  getDashboardAnalytics,
  getB2BDashboard,
  generateInvoice,
  listInvoices,
  getInvoice,
  downloadInvoice,
  emailInvoice,
} from '../controllers/b2b.dashboard.controller.js'
import {
  listB2BApplications,
  updateB2BApplicationStatus,
  listB2BUsers,
  approveB2BUser,
  rejectB2BUser,
  getB2BUserOrders,
  messageB2BUser,
} from '../controllers/b2b.admin.controller.js'

const router = Router()

/* ── Public ── */
router.post('/register', withMulter(b2bRegistrationUpload), registerB2BPartner)

/* ── Authenticated (any B2B applicant) ── */
router.get('/me', protect, getMyB2BProfile)
router.patch('/me/license', protect, withMulter(b2bDocumentUpload), uploadB2BLicense)

/* ── Verified B2B partners only ── */
router.use(protect, requireB2BVerified)

/* Products */
router.get('/products', listB2BProducts)
router.get('/products/:id/pricing', getB2BProductPricing)
router.get('/products/:id', getB2BProduct)
router.post('/calculate-price', calculateBulkPrice)

/* Legacy catalog alias */
router.get('/catalog', listB2BProducts)

/* Favorites */
router.get('/favorites', listB2BFavorites)
router.post('/favorites/:productId', addB2BFavorite)
router.delete('/favorites/:productId', removeB2BFavorite)

/* Orders */
router.post('/orders', createB2BOrder)
router.get('/orders', listB2BOrders)
router.get('/orders/:orderId', getB2BOrder)
router.put('/orders/:orderId', updateB2BOrder)
router.delete('/orders/:orderId', cancelB2BOrder)
router.post('/orders/:orderId/reorder', reorderB2BOrder)

/* Invoices */
router.post('/invoices/generate', generateInvoice)
router.get('/invoices', listInvoices)
router.get('/invoices/:invoiceId', getInvoice)
router.post('/invoices/:invoiceId/download', downloadInvoice)
router.post('/invoices/:invoiceId/email', emailInvoice)

/* Dashboard */
router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/recent-orders', getDashboardRecentOrders)
router.get('/dashboard/analytics', getDashboardAnalytics)
router.get('/dashboard', getB2BDashboard)

/* Account */
router.get('/account', getB2BAccount)
router.put('/account', updateB2BAccount)
router.get('/account/users', listTeamMembers)
router.post('/account/users', addTeamMember)
router.delete('/account/users/:userId', removeTeamMember)
router.put('/account/settings', updateAccountSettings)

/* ── Admin B2B (mounted at /api/admin/b2b and /api/admin/b2b-users) ── */

export const b2bAdminRouter = Router()
b2bAdminRouter.use(protect, authorizePermission(PERMISSIONS.MANAGE_B2B))
b2bAdminRouter.get('/applications', listB2BApplications)
b2bAdminRouter.patch('/applications/:id', updateB2BApplicationStatus)

export const b2bUsersAdminRouter = Router()
b2bUsersAdminRouter.use(protect, authorizePermission(PERMISSIONS.MANAGE_B2B))
b2bUsersAdminRouter.get('/', listB2BUsers)
b2bUsersAdminRouter.put('/:userId/approve', approveB2BUser)
b2bUsersAdminRouter.put('/:userId/reject', rejectB2BUser)
b2bUsersAdminRouter.get('/:userId/orders', getB2BUserOrders)
b2bUsersAdminRouter.post('/:userId/message', messageB2BUser)

export default router
