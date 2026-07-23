import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import { paymentRateLimit } from '../middleware/paymentRateLimit.js'
import { initiatePaymentSchema } from '../validators/payment.schemas.js'
import {
  initiatePayment,
  handlePaymeWebhook,
  handleClickWebhook,
  handleUzumWebhook,
  getPaymentStatus,
} from '../controllers/payment.controller.js'

const router = Router()
const webhookLimit = paymentRateLimit({ windowMs: 60000, max: 200 })

/** POST /api/payment/initiate — start Payme / Click / Uzum Bank checkout */
router.post('/initiate', protect, validateRequest(initiatePaymentSchema), initiatePayment)

/** Provider webhooks (no auth — verified via signature / Basic auth) */
router.post('/payme/callback', webhookLimit, handlePaymeWebhook)
router.post('/click/callback', webhookLimit, handleClickWebhook)
router.post('/uzumbank/callback', webhookLimit, handleUzumWebhook)

/** GET /api/payment/status/:orderId */
router.get('/status/:orderId', protect, getPaymentStatus)

export default router
