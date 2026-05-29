import mongoose from 'mongoose'

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['main', 'gallery', 'section'], default: 'gallery' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

/** Explicit sub-schema — avoids Mongoose interpreting `type` as a path option */
const filtersSchema = new mongoose.Schema(
  {
    color: { type: String, default: '', trim: true },
    material: { type: String, default: '', trim: true },
    size: { type: String, default: '', trim: true },
    /** Named productType because `type` is reserved in Mongoose schema definitions */
    productType: { type: String, default: '', trim: true },
  },
  { _id: false }
)

const dimensionsSchema = new mongoose.Schema(
  {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    depth: { type: Number, default: null },
    unit: { type: String, default: 'cm', enum: ['cm', 'm', 'in'] },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: null, min: 0 },
    mainImage: { type: String, default: null },
    gallery: { type: [String], default: [] },
    images: { type: [productImageSchema], default: [] },
    colors: {
      type: [String],
      default: [],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr)) return false
          return arr.every((c) => typeof c === 'string' && /^#([0-9a-f]{6})$/.test(c))
        },
        message: 'Each color must be a valid #rrggbb hex string',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    materials: { type: [String], default: [] },
    dimensions: {
      type: dimensionsSchema,
      default: () => ({}),
    },
    filters: {
      type: filtersSchema,
      default: () => ({}),
    },
    stock: { type: Number, default: 0, min: 0 },
    isFlashSale: { type: Boolean, default: false, index: true },
    flashSaleDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    flashSaleEndsAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', sku: 'text', description: 'text' })
productSchema.index({ 'filters.color': 1, 'filters.material': 1 })

export default mongoose.model('Product', productSchema)
