import mongoose from 'mongoose'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'awaiting', 'paid', 'failed', 'refunded']
export const PAYMENT_METHODS = ['payme', 'click', 'uzumbank', 'cash', 'card', 'installment', 'bank_transfer', 'online']

const installmentDetailsSchema = new mongoose.Schema(
  {
    planMonths: { type: Number, required: true, min: 1 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    totalAmountWithInterest: { type: Number, required: true, min: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    paidMonths: { type: Number, default: 0, min: 0 },
    nextPaymentDate: { type: Date },
    markupPercent: { type: Number, default: 0, min: 0 },
    markupAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
)

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    productName_uz: { type: String, default: '' },
    productName_ru: { type: String, default: '' },
    productName_en: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    price: { type: Number, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, min: 0 },
    color: { type: String, default: '' },
  },
  { _id: false }
)

const premiumServicesSchema = new mongoose.Schema(
  {
    deliveryToFloor: { type: Boolean, default: false },
    professionalAssembly: { type: Boolean, default: false },
  },
  { _id: false }
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'Uzbekistan' },
  },
  { _id: false }
)

const guestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isGuest: { type: Boolean, default: false, index: true },
    guest: { type: guestSchema, default: null },
    trackingToken: { type: String, default: '', select: false },
    items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'Order must contain items'] },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'payme' },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, min: 0 },
    discount_amount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    serviceFees: { type: Number, default: 0, min: 0 },
    premiumServices: { type: premiumServicesSchema, default: () => ({}) },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '', maxlength: 2000 },
    orderNotes: { type: String, default: '', maxlength: 2000 },
    installmentDetails: { type: installmentDetailsSchema, default: null },
    isB2B: { type: Boolean, default: false, index: true },
    poNumber: { type: String, default: '', trim: true },
    estimatedDeliveryDate: { type: Date, default: null },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

orderSchema.virtual('userId').get(function userIdGetter() {
  return this.customer
})

orderSchema.pre('save', function syncOrderFields(next) {
  if (this.customer && !this.userId) {
    /* virtual only */
  }

  for (const item of this.items || []) {
    if (item.product && !item.productId) item.productId = item.product
    if (item.unitPrice != null && item.price == null) item.price = item.unitPrice
    if (item.lineTotal != null && item.subtotal == null) item.subtotal = item.lineTotal
    if (!item.name && item.productName_uz) item.name = item.productName_uz
  }

  if (this.totalPrice == null && this.subtotal != null) this.totalPrice = this.subtotal
  if (this.finalPrice == null && this.total != null) this.finalPrice = this.total
  if (this.total == null && this.finalPrice != null) this.total = this.finalPrice
  if (this.subtotal == null && this.totalPrice != null) this.subtotal = this.totalPrice

  if (this.notes && !this.orderNotes) this.orderNotes = this.notes
  if (this.orderNotes && !this.notes) this.notes = this.orderNotes

  if (this.paymentStatus === 'pending' || this.paymentStatus === 'awaiting') {
    /* keep legacy values */
  } else if (this.paymentStatus === 'unpaid' && !this.isNew) {
    /* ok */
  }

  next()
})

orderSchema.pre('validate', function requireCustomerOrGuest(next) {
  if (!this.customer && !this.guest?.email) {
    this.invalidate('customer', 'Either customer or guest details are required')
  }
  next()
})

orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ customer: 1, status: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ paymentStatus: 1, createdAt: -1 })
orderSchema.index({ isGuest: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })

export default mongoose.model('Order', orderSchema)
