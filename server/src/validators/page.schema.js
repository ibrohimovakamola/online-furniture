import { z } from 'zod'

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')

const localeSchema = z
  .object({
    title: z.string().trim().max(200).optional().default(''),
    content: z.string().optional().default(''),
    description: z.string().trim().max(500).optional().default(''),
    seoTitle: z.string().trim().max(70).optional().default(''),
  })
  .optional()

const pageExtras = {
  seoTitle: z.string().trim().max(70).optional().default(''),
  focusKeyword: z.string().trim().max(120).optional().default(''),
  featuredImage: z.string().trim().max(500).optional().default(''),
  ogTitle: z.string().trim().max(120).optional().default(''),
  ogDescription: z.string().trim().max(300).optional().default(''),
  ogImage: z.string().trim().max(500).optional().default(''),
  template: z.enum(['default', 'full-width', 'legal', 'landing']).optional().default('default'),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  translations: z
    .object({
      uz: localeSchema,
      ru: localeSchema,
      en: localeSchema,
    })
    .optional(),
}

export const createPageSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(2).max(200),
    content: z.string().trim().min(10),
    description: z.string().trim().max(500).optional().default(''),
    keywords: z.array(z.string().trim().min(1)).optional().default([]),
    published: z.boolean().optional(),
    ...pageExtras,
  })
  .transform((data) => {
    const status =
      data.status ||
      (typeof data.published === 'boolean' ? (data.published ? 'published' : 'draft') : 'draft')
    return {
      ...data,
      status,
      published: status === 'published',
    }
  })

export const updatePageSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    content: z.string().trim().min(10).optional(),
    description: z.string().trim().max(500).optional(),
    keywords: z.array(z.string().trim().min(1)).optional(),
    published: z.boolean().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    focusKeyword: z.string().trim().max(120).optional(),
    featuredImage: z.string().trim().max(500).optional(),
    ogTitle: z.string().trim().max(120).optional(),
    ogDescription: z.string().trim().max(300).optional(),
    ogImage: z.string().trim().max(500).optional(),
    template: z.enum(['default', 'full-width', 'legal', 'landing']).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    translations: z
      .object({
        uz: localeSchema,
        ru: localeSchema,
        en: localeSchema,
      })
      .optional(),
  })
  .transform((data) => {
    const next = { ...data }
    if (next.status) {
      next.published = next.status === 'published'
    } else if (typeof next.published === 'boolean') {
      next.status = next.published ? 'published' : 'draft'
    }
    return next
  })

export function parseCreatePage(body) {
  return createPageSchema.safeParse(body)
}

export function parseUpdatePage(body) {
  return updatePageSchema.safeParse(body)
}
