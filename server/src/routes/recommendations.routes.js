import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getUserProductRecommendations } from '../controllers/recommendations.controller.js'
import { asyncHandler, AuthorizationError } from '../utils/asyncHandler.js'

const router = Router()

const assertCanViewUserRecommendations = asyncHandler(async (req, _res, next) => {
  if (
    String(req.user._id) !== String(req.params.userId) &&
    !['super_admin', 'manager'].includes(req.user.role)
  ) {
    throw new AuthorizationError('Forbidden')
  }
  next()
})

/** Personalized recommendations — optional auth (user can only request own id unless admin) */
router.get('/user/:userId', protect, assertCanViewUserRecommendations, getUserProductRecommendations)

export default router
