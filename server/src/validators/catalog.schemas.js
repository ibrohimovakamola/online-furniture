import Joi from 'joi'

const langField = Joi.string().trim().max(200)
const langDesc = Joi.string().trim().max(5000).allow('')

export const createCategorySchema = Joi.object({
  name: langField,
  name_uz: langField.required(),
  name_ru: langDesc,
  name_en: langDesc,
  slug: Joi.string().trim().lowercase().max(120).pattern(/^[a-z0-9-]+$/),
  description: langDesc,
  description_uz: langDesc,
  description_ru: langDesc,
  description_en: langDesc,
  image: Joi.string().trim().max(500).allow('', null),
  isActive: Joi.boolean(),
})

export const updateCategorySchema = createCategorySchema.fork(
  ['name_uz'],
  (schema) => schema.optional()
).min(1)

export const categoryListQuerySchema = Joi.object({
  lang: Joi.string().valid('uz', 'ru', 'en'),
  search: Joi.string().trim().max(120).allow(''),
})

export const productListQuerySchema = Joi.object({
  lang: Joi.string().valid('uz', 'ru', 'en'),
  category: Joi.string().trim().max(120).allow(''),
  min: Joi.number().min(0),
  max: Joi.number().min(0),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  rating: Joi.number().min(0).max(5),
  minRating: Joi.number().min(0).max(5),
  search: Joi.string().trim().max(120).allow(''),
  sort: Joi.string().valid('price_asc', 'price_desc', 'newest', 'rating', 'popular', 'bestseller'),
  stockStatus: Joi.string().valid('inStock', 'outOfStock', 'lowStock').allow(''),
  color: Joi.string().trim().max(80).allow(''),
  material: Joi.string().trim().max(120).allow(''),
  query: Joi.string().trim().max(120).allow(''),
  q: Joi.string().trim().max(120).allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  skip: Joi.number().integer().min(0),
  fields: Joi.string().trim().max(200).allow(''),
})

const specificationsObjectSchema = Joi.object({
  material_uz: langDesc,
  material_ru: langDesc,
  material_en: langDesc,
  dimensions: Joi.object({
    length: Joi.number().min(0).allow(null),
    width: Joi.number().min(0).allow(null),
    height: Joi.number().min(0).allow(null),
  }),
  weight: Joi.number().min(0).allow(null),
  color_uz: langDesc,
  color_ru: langDesc,
  color_en: langDesc,
  warranty_months: Joi.number().integer().min(0).allow(null),
})

const specificationsSchema = Joi.alternatives().try(
  specificationsObjectSchema,
  Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value)
      const { error, value: validated } = specificationsObjectSchema.validate(parsed)
      if (error) return helpers.error('any.invalid')
      return validated
    } catch {
      return helpers.error('any.invalid')
    }
  })
)

const imageUrlsSchema = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim().max(500)).min(3),
  Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) return helpers.error('any.invalid')
      return parsed
    } catch {
      const parts = value.split(',').map((s) => s.trim()).filter(Boolean)
      return parts.length ? parts : helpers.error('any.invalid')
    }
  })
)

export const createProductSchema = Joi.object({
  name: langField,
  name_uz: langField.required(),
  name_ru: langDesc,
  name_en: langDesc,
  description: langDesc,
  description_uz: langDesc,
  description_ru: langDesc,
  description_en: langDesc,
  price: Joi.number().min(0).required(),
  basePrice: Joi.number().min(0),
  discount_percent: Joi.number().min(0).max(100).default(0),
  category: Joi.string().hex().length(24).required(),
  imageUrls: imageUrlsSchema.optional(),
  specifications: specificationsSchema,
  stock: Joi.number().integer().min(0).default(0),
  rating: Joi.number().min(0).max(5).default(0),
  reviews_count: Joi.number().integer().min(0).default(0),
  sku: Joi.string().trim().max(80),
  isActive: Joi.boolean().default(true),
  isPublished: Joi.boolean(),
})

export const productSearchQuerySchema = productListQuerySchema

export const updateProductSchema = createProductSchema
  .fork(['name_uz', 'price', 'category'], (schema) => schema.optional())
  .min(1)
