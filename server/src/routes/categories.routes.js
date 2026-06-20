import { Router } from 'express'
import { protect, authorizePermission } from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { categoryUpload } from '../middleware/upload.js'
import { withMulter } from '../middleware/multerError.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/catalog.schemas.js'
import {
  listCatalogCategories,
  getCatalogCategory,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
} from '../controllers/catalog.category.controller.js'

const router = Router()

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/', listCatalogCategories)
router.get('/:id', getCatalogCategory)

router.post(
  '/',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_CATEGORIES),
  withMulter(categoryUpload),
  validateRequest(createCategorySchema),
  createCatalogCategory
)

router.put(
  '/:id',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_CATEGORIES),
  withMulter(categoryUpload),
  validateRequest(updateCategorySchema),
  updateCatalogCategory
)

router.delete(
  '/:id',
  protect,
  authorizePermission(PERMISSIONS.MANAGE_CATEGORIES),
  deleteCatalogCategory
)

export default router
