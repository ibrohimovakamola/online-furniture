import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import { addCartItemSchema, updateCartItemSchema } from '../validators/cart.schemas.js'
import { cartAddValidators } from '../middleware/validationChains.js'
import {
  getCart,
  addCartItem,
  updateCartItemByProduct,
  removeCartItemByProduct,
  clearCart,
  replaceCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cart.controller.js'

const router = Router()

router.use(protect)

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart contents
 */
router.get('/', getCart)
router.post('/', cartAddValidators, validateRequest(addCartItemSchema), addCartItem)
router.put('/item/:productId', validateRequest(updateCartItemSchema), updateCartItemByProduct)
router.delete('/item/:productId', removeCartItemByProduct)
router.delete('/', clearCart)

/** Legacy aliases */
router.put('/', replaceCart)
router.post('/items', cartAddValidators, validateRequest(addCartItemSchema), addCartItem)
router.patch('/items/:itemId', validateRequest(updateCartItemSchema), updateCartItem)
router.delete('/items/:itemId', removeCartItem)

export default router
