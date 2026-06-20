import mongoose from 'mongoose'

const pageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    description: { type: String, default: '', trim: true },
    keywords: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
)

export default mongoose.model('Page', pageSchema)
