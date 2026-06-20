import Joi from 'joi'

const uzPhoneSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const digits = value.replace(/\s/g, '')
    if (/^\+998\d{9}$/.test(digits)) return digits
    if (/^998\d{9}$/.test(digits)) return `+${digits}`
    if (/^\d{9}$/.test(digits)) return `+998${digits}`
    return helpers.error('any.invalid')
  })
  .messages({ 'any.invalid': 'Phone must be Uzbekistan format (+998XXXXXXXXX)' })

const orderItemSchema = Joi.object({
  productId: Joi.string().trim().max(64),
  id: Joi.string().trim().max(64),
  name: Joi.string().trim().max(200),
  quantity: Joi.number().integer().min(1).max(100).required(),
  price: Joi.number().positive().max(1_000_000_000),
  color: Joi.string().trim().max(80),
}).or('productId', 'id')

const premiumServicesSchema = Joi.object({
  deliveryToFloor: Joi.boolean(),
  professionalAssembly: Joi.boolean(),
})

/** POST /api/orders/guest */
export const createGuestOrderSchema = Joi.object({
  guestEmail: Joi.string().trim().email().required(),
  guestPhone: uzPhoneSchema.required(),
  guestName: Joi.string().trim().min(2).max(120).required(),
  items: Joi.array().items(orderItemSchema).min(1).max(50).required(),
  shippingAddress: Joi.object({
    street: Joi.string().trim().min(1).max(300).required(),
    city: Joi.string().trim().min(1).max(120).required(),
    region: Joi.string().trim().max(120).allow(''),
    zipCode: Joi.string().trim().max(20).allow(''),
    postalCode: Joi.string().trim().max(20).allow(''),
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'payme', 'click').required(),
  totalPrice: Joi.number().positive().max(1_000_000_000).required(),
  premiumServices: premiumServicesSchema,
  returnUrl: Joi.string().uri({ allowRelative: false }).max(500),
})

/** POST /api/orders/checkout — authenticated */
export const checkoutOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).max(50).required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required(),
    phone: uzPhoneSchema.required(),
    street: Joi.string().trim().min(1).max(300).required(),
    city: Joi.string().trim().min(1).max(120).required(),
    region: Joi.string().trim().max(120).allow(''),
    zipCode: Joi.string().trim().max(20).allow(''),
    postalCode: Joi.string().trim().max(20).allow(''),
    email: Joi.string().trim().email().max(120),
  }).required(),
  paymentMethod: Joi.string()
    .valid('card', 'cash', 'payme', 'click', 'installment')
    .default('card'),
  payment: Joi.object({
    cardNumber: Joi.string().trim().max(24),
    expiry: Joi.string().trim().max(10),
    cvv: Joi.string().trim().max(4),
  }),
  premiumServices: premiumServicesSchema,
  installmentPlan: Joi.object({
    months: Joi.number().integer().min(2).max(24),
    downPaymentPercent: Joi.number().min(0).max(100),
  }).unknown(true),
  returnUrl: Joi.string().uri({ allowRelative: false }).max(500),
})

/** POST /api/orders — create order from server cart */
export const createOrderFromCartSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required(),
    phone: uzPhoneSchema.required(),
    email: Joi.string().trim().email().max(120).required(),
    region: Joi.string().trim().max(120).allow(''),
    city: Joi.string().trim().min(1).max(120).required(),
    street: Joi.string().trim().min(1).max(300).required(),
    postalCode: Joi.string().trim().max(20).allow(''),
  }).required(),
  paymentMethod: Joi.string().valid('payme', 'click', 'cash').required(),
  notes: Joi.string().trim().max(2000).allow(''),
  discount_amount: Joi.number().min(0).max(1_000_000_000).default(0),
  returnUrl: Joi.string().uri({ allowRelative: false }).max(500),
})

export const orderListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
})

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().trim().max(500).allow(''),
})

export const updatePaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string().valid('unpaid', 'paid', 'refunded').required(),
  note: Joi.string().trim().max(500).allow(''),
})

export { uzPhoneSchema }
