import mongoose from 'mongoose'

export const GALLERY_CATEGORIES = ['living-room', 'bedroom', 'kitchen', 'office']

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: GALLERY_CATEGORIES,
      required: true,
      index: true,
    },
    image: { type: galleryImageSchema, required: true },
    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    likes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

gallerySchema.index({ active: 1, category: 1, order: 1 })

export default mongoose.model('Gallery', gallerySchema)
