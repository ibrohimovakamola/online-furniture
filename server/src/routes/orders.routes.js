import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { checkout, myOrders } from '../controllers/checkout.controller.js'

const router = Router()

router.post('/checkout', protect, checkout)
router.get('/my', protect, myOrders)

export default router
