import mongoose from 'mongoose'

const errorLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, index: true },
    stack: { type: String, default: '' },
    statusCode: { type: Number, default: 500, index: true },
    path: { type: String, default: '', index: true },
    method: { type: String, default: '' },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    fingerprint: { type: String, required: true, index: true },
    count: { type: Number, default: 1, min: 1 },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

errorLogSchema.index({ lastSeenAt: -1 })
errorLogSchema.index({ count: -1 })

export default mongoose.model('ErrorLog', errorLogSchema)
