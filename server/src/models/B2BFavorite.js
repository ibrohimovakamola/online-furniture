import mongoose from 'mongoose'

const b2bFavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  },
  { timestamps: true }
)

b2bFavoriteSchema.index({ user: 1, product: 1 }, { unique: true })

export default mongoose.model('B2BFavorite', b2bFavoriteSchema)
