import { Router } from 'express'
import { listStoreProducts, getStoreProduct, listStoreCategories } from '../controllers/store.controller.js'
import { getStoreSettings } from '../controllers/settings.controller.js'
import { getStoreFlashSale } from '../controllers/flashSale.controller.js'

const router = Router()

router.get('/settings', getStoreSettings)
router.get('/flash-sale', getStoreFlashSale)

router.get('/products', listStoreProducts)
router.get('/products/:id', getStoreProduct)
router.get('/categories', listStoreCategories)

export default router
