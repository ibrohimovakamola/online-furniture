import { z } from 'zod'
import { FAQ_CATEGORIES } from '../models/FAQ.js'

const categorySchema = z.enum(FAQ_CATEGORIES)

export const createFaqSchema = z.object({
  question: z.string().trim().min(10),
  answer: z.string().trim().min(20),
  category: categorySchema.default('general'),
  order: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export const updateFaqSchema = createFaqSchema.partial()

export function parseCreateFaq(body) {
  return createFaqSchema.safeParse(body)
}

export function parseUpdateFaq(body) {
  return updateFaqSchema.safeParse(body)
}
