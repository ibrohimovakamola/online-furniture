import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createReviewSchema,
  updateReviewSchema,
} from '../validators/review.schemas.js'
import {
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
} from '../controllers/review.controller.js'

const router = Router()

router.post('/', protect, validateRequest(createReviewSchema), createReview)
router.put('/:reviewId', protect, validateRequest(updateReviewSchema), updateReview)
router.delete('/:reviewId', protect, deleteReview)
router.post('/:reviewId/helpful', protect, markReviewHelpful)

export default router
