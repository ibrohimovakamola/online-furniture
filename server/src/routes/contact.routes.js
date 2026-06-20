import { Router } from 'express'
import { submitContact } from '../controllers/contact.controller.js'
import { contactValidators } from '../middleware/validationChains.js'
import { contactLimiter } from '../middleware/security.js'
import { sanitizeBodyStrings } from '../middleware/validators.js'

const router = Router()

router.post('/', contactLimiter, sanitizeBodyStrings(), contactValidators, submitContact)

export default router
