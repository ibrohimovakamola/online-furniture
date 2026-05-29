import mongoose from 'mongoose'

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
export const PAYMENT_METHODS = ['card', 'cash', 'bank_transfer', 'online']

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
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

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'Order must contain items'] },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'online' },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    serviceFees: { type: Number, default: 0, min: 0 },
    premiumServices: { type: premiumServicesSchema, default: () => ({}) },
    total: { type: Number, required: true, min: 0 },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
