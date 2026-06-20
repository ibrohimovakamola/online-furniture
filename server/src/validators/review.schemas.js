import Joi from 'joi'

export const createReviewSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(200).allow(''),
  comment: Joi.string().trim().min(10).max(1000).required(),
  images: Joi.array().items(Joi.string().trim().uri().max(500)).max(5).default([]),
})

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  title: Joi.string().trim().max(200).allow(''),
  comment: Joi.string().trim().min(10).max(1000),
  images: Joi.array().items(Joi.string().trim().uri().max(500)).max(5),
}).min(1)

export const reviewListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sort: Joi.string().valid('newest', 'oldest', 'rating_high', 'rating_low', 'helpful').default('newest'),
  rating: Joi.number().integer().min(1).max(5),
})

export const adminReviewListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('date', 'rating', 'helpful', 'newest').default('date'),
  status: Joi.string().valid('pending', 'approved', 'rejected').allow(''),
  productId: Joi.string().hex().length(24).allow(''),
  search: Joi.string().trim().max(120).allow(''),
})
