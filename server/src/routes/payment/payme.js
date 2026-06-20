import { Router } from 'express'
import { protect } from '../../middleware/auth.js'
import { paymentRateLimit } from '../../middleware/paymentRateLimit.js'
import { initPayme, paymeWebhook } from '../../controllers/payme.controller.js'

const router = Router()
const webhookLimit = paymentRateLimit({ windowMs: 60000, max: 200 })

/** Authenticated — generate Payme checkout URL for an existing order */
router.post('/init', protect, initPayme)

/** Public — Payme Merchant API webhook (register URL in Payme dashboard) */
router.post('/webhook', webhookLimit, paymeWebhook)

export default router
