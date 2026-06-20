import { Router } from 'express'
import { protect, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { productUpload } from '../middleware/upload.js'
import { withMulter } from '../middleware/multerError.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  productSearchQuerySchema,
} from '../validators/catalog.schemas.js'
import {
  listCatalogProducts,
  getCatalogProduct,
  searchCatalogProducts,
  createCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct,
} from '../controllers/catalog.product.controller.js'
import { searchProducts, searchSuggestions } from '../controllers/productSearch.controller.js'
import {
  getProductRecommendations,
  getTrending,
  getBestsellers,
} from '../controllers/recommendations.controller.js'
import {
  listProductReviews,
  getProductReviewStats,
} from '../controllers/review.controller.js'
import { reviewListQuerySchema } from '../validators/review.schemas.js'

const router = Router()
const reviewListQuery = validateRequest(reviewListQuerySchema, { source: 'query' })

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Product list
 */
router.get('/', validateRequest(productListQuerySchema, { source: 'query' }), listCatalogProducts)

router.get('/suggestions', searchSuggestions)
router.get('/search', validateRequest(productSearchQuerySchema, { source: 'query' }), searchProducts)
router.get('/trending', getTrending)
router.get('/bestsellers', getBestsellers)

/** Legacy path-based search — must be before /:id */
router.get('/search/:query', searchCatalogProducts)

router.get('/:productId/reviews/stats', reviewListQuery, getProductReviewStats)
router.get('/:productId/reviews', reviewListQuery, listProductReviews)

router.get('/:id/recommendations', getProductRecommendations)
router.get('/:id', getCatalogProduct)

router.post(
  '/',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_PRODUCTS),
  withMulter(productUpload),
  validateRequest(createProductSchema),
  createCatalogProduct
)

router.put(
  '/:id',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_PRODUCTS),
  withMulter(productUpload),
  validateRequest(updateProductSchema),
  updateCatalogProduct
)

router.delete(
  '/:id',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_PRODUCTS),
  deleteCatalogProduct
)

export default router
