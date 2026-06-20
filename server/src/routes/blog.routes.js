import { Router } from 'express'
import { getBlogBySlug, listBlogs } from '../controllers/blog.controller.js'

const router = Router()

router.get('/', listBlogs)
router.get('/:slug', getBlogBySlug)

export default router
