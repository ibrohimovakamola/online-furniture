import Joi from 'joi'

export const initiatePaymentSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  paymentMethod: Joi.string().valid('payme', 'click', 'uzumbank'),
  gateway: Joi.string().valid('payme', 'click', 'uzumbank'),
  returnUrl: Joi.string().uri({ allowRelative: false }).max(500),
}).or('paymentMethod', 'gateway')
