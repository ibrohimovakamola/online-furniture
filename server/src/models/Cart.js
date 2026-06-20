import mongoose from 'mongoose'

/**
 * Cart line item — references Product with price snapshot at add time.
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price_at_purchase: { type: Number, min: 0, default: 0 },
    addedAt: { type: Date, default: Date.now },
    /** Selected variant (hex color from product.colors) */
    color: { type: String, default: '', trim: true },
  },
  { _id: true }
)

/**
 * Server-side cart for authenticated customers.
 * `user` is the canonical ref; exposed as userId in API responses.
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
)

cartSchema.virtual('userId').get(function userIdGetter() {
  return this.user
})

cartSchema.set('toJSON', { virtuals: true })
cartSchema.set('toObject', { virtuals: true })

export default mongoose.model('Cart', cartSchema)
