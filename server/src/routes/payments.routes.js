import { Router } from 'express'
import { protect, authorizePermission } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import { paymentRateLimit } from '../middleware/paymentRateLimit.js'
import { initiatePaymentSchema } from '../validators/payment.schemas.js'
import {
  initiatePayment,
  handlePaymeWebhook,
  handleClickWebhook,
  getPaymentStatus,
  paymeWebhook,
  clickCallback,
  initGatewayPayment,
  refundPayment,
  listPaymentLogs,
  listGateways,
} from '../controllers/payment.controller.js'
import { PERMISSIONS } from '../config/roles.js'

const router = Router()
const webhookLimit = paymentRateLimit({ windowMs: 60000, max: 200 })

router.get('/gateways', listGateways)

/** Primary API (mebelsotish.uz spec) */
router.post('/initiate', protect, validateRequest(initiatePaymentSchema), initiatePayment)
router.post('/payme-callback', webhookLimit, handlePaymeWebhook)
router.post('/click-callback', webhookLimit, handleClickWebhook)
router.get('/:orderId/status', protect, getPaymentStatus)

/** Legacy aliases */
router.post('/init', protect, validateRequest(initiatePaymentSchema), initGatewayPayment)
router.post('/payme/webhook', webhookLimit, paymeWebhook)
router.get('/click/callback', webhookLimit, clickCallback)
router.post('/click/callback', webhookLimit, clickCallback)
router.get('/status/:orderId', protect, getPaymentStatus)

router.get('/logs', protect, authorizePermission(PERMISSIONS.VIEW_ORDERS), listPaymentLogs)
router.post('/:paymentId/refund', protect, authorizePermission(PERMISSIONS.UPDATE_ORDER_STATUS), refundPayment)

export default router
