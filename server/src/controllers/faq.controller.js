import FAQ from '../models/FAQ.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parseCreateFaq, parseUpdateFaq } from '../validators/faq.schema.js'

export function formatFaq(doc) {
  const item = doc.toObject ? doc.toObject() : doc
  return {
    id: item._id,
    question: item.question,
    answer: item.answer,
    category: item.category,
    order: item.order,
    active: item.active,
    views: item.views,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/** GET /api/faq — public active FAQs */
export const listPublicFaqs = asyncHandler(async (req, res) => {
  const query = { active: true }
  if (req.query.category) {
    query.category = String(req.query.category)
  }

  const faqs = await FAQ.find(query).sort({ order: 1, createdAt: 1 }).lean()

  res.json({
    success: true,
    faqs: faqs.map(formatFaq),
  })
})

/** GET /api/faq/:id — public single FAQ + view counter */
export const getPublicFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findOneAndUpdate(
    { _id: req.params.id, active: true },
    { $inc: { views: 1 } },
    { new: true }
  )

  if (!faq) throw new AppError('FAQ not found', 404)

  res.json({
    success: true,
    faq: formatFaq(faq),
  })
})

/** GET /api/admin/faq — admin list (all) */
export const listAdminFaqs = asyncHandler(async (_req, res) => {
  const faqs = await FAQ.find().sort({ order: 1, createdAt: 1 })
  res.json({
    success: true,
    faqs: faqs.map(formatFaq),
  })
})

/** POST /api/admin/faq */
export const createFaq = asyncHandler(async (req, res) => {
  const parsed = parseCreateFaq(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const data = parsed.data
  if (data.order == null) {
    const max = await FAQ.findOne().sort({ order: -1 }).select('order').lean()
    data.order = (max?.order ?? -1) + 1
  }

  const faq = await FAQ.create({
    question: data.question,
    answer: data.answer,
    category: data.category,
    order: data.order,
    active: data.active ?? true,
  })

  res.status(201).json({
    success: true,
    faq: formatFaq(faq),
  })
})

/** PUT /api/admin/faq/:id */
export const updateFaq = asyncHandler(async (req, res) => {
  const parsed = parseUpdateFaq(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const faq = await FAQ.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  })

  if (!faq) throw new AppError('FAQ not found', 404)

  res.json({
    success: true,
    faq: formatFaq(faq),
  })
})

/** DELETE /api/admin/faq/:id */
export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndDelete(req.params.id)
  if (!faq) throw new AppError('FAQ not found', 404)
  res.json({ success: true, message: 'FAQ deleted' })
})
