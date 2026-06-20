import { Router } from 'express'
import { getPublicPage } from '../controllers/page.controller.js'

const router = Router()

router.get('/:slug', getPublicPage)

export default router
