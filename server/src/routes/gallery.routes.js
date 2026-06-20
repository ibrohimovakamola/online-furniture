import { Router } from 'express'
import { listPublicGallery } from '../controllers/gallery.controller.js'

const router = Router()

router.get('/', listPublicGallery)

export default router
