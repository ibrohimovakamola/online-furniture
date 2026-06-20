import mongoose from 'mongoose'

export const ACTIVITY_TYPES = ['view', 'purchase', 'review', 'login', 'admin_action']

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ type: 1, createdAt: -1 })
activityLogSchema.index({ action: 1, createdAt: -1 })

export default mongoose.model('ActivityLog', activityLogSchema)
