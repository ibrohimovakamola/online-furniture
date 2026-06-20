import mongoose from 'mongoose'

export const FAQ_CATEGORIES = ['general', 'shipping', 'payment', 'returns']

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, minlength: 10, trim: true },
    answer: { type: String, required: true, minlength: 20, trim: true },
    category: {
      type: String,
      enum: FAQ_CATEGORIES,
      default: 'general',
      index: true,
    },
    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

faqSchema.index({ active: 1, category: 1, order: 1 })

export default mongoose.model('FAQ', faqSchema)
