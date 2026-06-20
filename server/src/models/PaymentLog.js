import mongoose from 'mongoose'

const paymentLogSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    gateway: { type: String, default: '', index: true },
    direction: { type: String, enum: ['inbound', 'outbound', 'internal'], default: 'inbound' },
    event: { type: String, required: true, index: true },
    status: { type: String, default: '' },
    requestIp: { type: String, default: '' },
    requestHeaders: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    responseBody: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('PaymentLog', paymentLogSchema)
