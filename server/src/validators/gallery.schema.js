import { z } from 'zod'
import { GALLERY_CATEGORIES } from '../models/Gallery.js'

const categorySchema = z.enum(GALLERY_CATEGORIES)

export const createGallerySchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional().default(''),
  category: categorySchema,
  alt: z.string().trim().optional(),
  order: z.coerce.number().int().min(0).optional(),
  active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => {
      if (val === undefined) return true
      if (typeof val === 'boolean') return val
      return val === 'true'
    }),
})

export const updateGallerySchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  category: categorySchema.optional(),
  alt: z.string().trim().optional(),
  order: z.coerce.number().int().min(0).optional(),
  active: z.union([z.boolean(), z.enum(['true', 'false'])]).optional().transform((val) => {
    if (val === undefined) return undefined
    if (typeof val === 'boolean') return val
    return val === 'true'
  }),
})

export function parseCreateGallery(body) {
  return createGallerySchema.safeParse(body)
}

export function parseUpdateGallery(body) {
  return updateGallerySchema.safeParse(body)
}
