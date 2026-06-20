import Joi from 'joi'
import { ORDER_STATUSES } from '../models/Order.js'
import { ROLES } from '../config/roles.js'

export const adminListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(200).allow(''),
  sortBy: Joi.string().trim().max(50).allow(''),
  sort: Joi.string().trim().max(50).allow(''),
  status: Joi.string().valid(...ORDER_STATUSES).allow(''),
  paymentStatus: Joi.string().valid('unpaid', 'paid', 'pending', 'awaiting', 'failed', 'refunded').allow(''),
  paymentMethod: Joi.string().trim().max(50).allow(''),
  role: Joi.string()
    .valid(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.CUSTOMER, ROLES.B2B_PARTNER)
    .allow(''),
  category: Joi.string().trim().max(100).allow(''),
  stockStatus: Joi.string().valid('inStock', 'outOfStock', 'lowStock').allow(''),
  dateRange: Joi.string().valid('7days', '30days', '90days', '12months', 'all').allow(''),
  isActive: Joi.boolean(),
})

export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid(ROLES.CUSTOMER, ROLES.MANAGER, ROLES.B2B_PARTNER)
    .required(),
})

export const updateProductStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required(),
  note: Joi.string().trim().max(500).allow(''),
})

export const bulkUpdateProductSchema = Joi.object({
  fields: Joi.object()
    .min(1)
    .keys({
      name: Joi.string().trim().max(200),
      name_uz: Joi.string().trim().max(200),
      name_ru: Joi.string().trim().max(200),
      name_en: Joi.string().trim().max(200),
      basePrice: Joi.number().min(0),
      discountedPrice: Joi.number().min(0).allow(null),
      stock: Joi.number().integer().min(0),
      isPublished: Joi.boolean(),
      description: Joi.string().max(10000).allow(''),
    })
    .required(),
})
