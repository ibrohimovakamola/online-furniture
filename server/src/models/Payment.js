import mongoose from 'mongoose'

export const PAYMENT_GATEWAYS = ['payme', 'click', 'uzumbank', 'card', 'manual']
export const PAYMENT_RECORD_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, required: true, index: true },
    transactionId: { type: String, default: '', index: true },
    externalId: { type: String, default: '', index: true },
    amount: { type: Number, required: true, min: 0 },
    amountTiyn: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'UZS' },
    status: {
      type: String,
      enum: PAYMENT_RECORD_STATUSES,
      default: 'pending',
      index: true,
    },
    paymeState: { type: Number, default: null },
    clickAction: { type: Number, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
    idempotencyKey: { type: String, default: '', index: true },
  },
  { timestamps: true }
)

paymentSchema.index({ gateway: 1, transactionId: 1 }, { unique: true, sparse: true })

paymentSchema.virtual('orderId').get(function orderIdGetter() {
  return this.order
})

paymentSchema.virtual('state').get(function stateGetter() {
  return this.paymeState
})

paymentSchema.virtual('completedAt').get(function completedAtGetter() {
  return this.paidAt
})

paymentSchema.set('toJSON', { virtuals: true })
paymentSchema.set('toObject', { virtuals: true })

export default mongoose.model('Payment', paymentSchema)
