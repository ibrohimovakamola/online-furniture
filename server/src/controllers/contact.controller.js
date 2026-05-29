import Contact from '../models/Contact.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { sanitizeContactBody, validateContactFields } from '../utils/sanitizeContact.js'

export const submitContact = asyncHandler(async (req, res) => {
  const sanitized = sanitizeContactBody(req.body)
  const errors = validateContactFields(sanitized)

  if (errors.length) {
    throw new AppError(errors.join('. '), 400)
  }

  const submission = await Contact.create(sanitized)

  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has been received. We will contact you within 24 hours.',
    data: {
      id: submission._id,
      createdAt: submission.createdAt,
    },
  })
})
