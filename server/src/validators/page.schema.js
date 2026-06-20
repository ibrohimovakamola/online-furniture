import { z } from 'zod'

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')

export const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(10),
  description: z.string().trim().max(500).optional().default(''),
  keywords: z.array(z.string().trim().min(1)).optional().default([]),
  published: z.boolean().optional().default(true),
})

export const updatePageSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  content: z.string().trim().min(10).optional(),
  description: z.string().trim().max(500).optional(),
  keywords: z.array(z.string().trim().min(1)).optional(),
  published: z.boolean().optional(),
})

export function parseCreatePage(body) {
  return createPageSchema.safeParse(body)
}

export function parseUpdatePage(body) {
  return updatePageSchema.safeParse(body)
}
