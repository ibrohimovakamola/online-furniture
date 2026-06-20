import Joi from 'joi'

export const addCartItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(100).default(1),
  color: Joi.string().trim().max(80).allow(''),
})

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required(),
})
