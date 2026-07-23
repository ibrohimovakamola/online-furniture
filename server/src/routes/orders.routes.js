import { Router } from 'express'
import { protect, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createGuestOrderSchema,
  checkoutOrderSchema,
  createOrderFromCartSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  createOrderPaymentSchema,
} from '../validators/order.schemas.js'
import { checkout, myOrders, createOrderPayment } from '../controllers/checkout.controller.js'
import { createGuestOrder, trackGuestOrder } from '../controllers/guestOrder.controller.js'
import {
  createOrderFromCart,
  listUserOrders,
  getUserOrder,
} from '../controllers/orders.user.controller.js'
import { updateOrderStatus, updateOrderPaymentStatus } from '../controllers/order.controller.js'

const router = Router()

/**
 * @swagger
 * /api/orders/guest:
 *   post:
 *     summary: Create guest order
 *     tags: [Orders]
 *     responses:
 *       201:
 *         description: Guest order created
 */
router.post('/guest', validateRequest(createGuestOrderSchema), createGuestOrder)
router.get('/track/:token', trackGuestOrder)

/** Legacy checkout with client-side cart payload */
router.post('/checkout', protect, validateRequest(checkoutOrderSchema), checkout)
router.post('/create-payment', protect, validateRequest(createOrderPaymentSchema), createOrderPayment)
router.get('/my', protect, myOrders)

/** Admin — status updates on public orders path */
router.put(
  '/:orderId/status',
  protect,
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus
)
router.put(
  '/:orderId/payment-status',
  protect,
  authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS),
  validateRequest(updatePaymentStatusSchema),
  updateOrderPaymentStatus
)

/** Authenticated order management */
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', protect, validateRequest(createOrderFromCartSchema), createOrderFromCart)
router.get('/', protect, validateRequest(orderListQuerySchema, { source: 'query' }), listUserOrders)
router.get('/:orderId', protect, getUserOrder)

export default router
