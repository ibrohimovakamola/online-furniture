import { Router } from 'express'
import { listPublicFaqs, getPublicFaq } from '../controllers/faq.controller.js'

const router = Router()

router.get('/', listPublicFaqs)
router.get('/:id', getPublicFaq)

export default router
