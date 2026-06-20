import mongoose from 'mongoose'

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected']

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200, default: '' },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    verified_purchase: { type: Boolean, default: false },
    helpful_count: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: 'pending',
      index: true,
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

reviewSchema.index({ product: 1, user: 1 }, { unique: true })
reviewSchema.index({ product: 1, status: 1, createdAt: -1 })
reviewSchema.index({ status: 1, rating: -1 })
reviewSchema.index({ status: 1, helpful_count: -1 })

export default mongoose.model('Review', reviewSchema)
