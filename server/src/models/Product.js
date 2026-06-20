import mongoose from 'mongoose'

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['main', 'gallery', 'section'], default: 'gallery' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const filtersSchema = new mongoose.Schema(
  {
    color: { type: String, default: '', trim: true },
    material: { type: String, default: '', trim: true },
    size: { type: String, default: '', trim: true },
    productType: { type: String, default: '', trim: true },
  },
  { _id: false }
)

const dimensionsSchema = new mongoose.Schema(
  {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    depth: { type: Number, default: null },
    length: { type: Number, default: null },
    unit: { type: String, default: 'cm', enum: ['cm', 'm', 'in'] },
  },
  { _id: false }
)

const specificationsSchema = new mongoose.Schema(
  {
    material_uz: { type: String, default: '', trim: true },
    material_ru: { type: String, default: '', trim: true },
    material_en: { type: String, default: '', trim: true },
    dimensions: {
      length: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    weight: { type: Number, default: null },
    color_uz: { type: String, default: '', trim: true },
    color_ru: { type: String, default: '', trim: true },
    color_en: { type: String, default: '', trim: true },
    warranty_months: { type: Number, default: null, min: 0 },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    name_uz: { type: String, default: '', trim: true },
    name_ru: { type: String, default: '', trim: true },
    name_en: { type: String, default: '', trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, default: '' },
    description_uz: { type: String, default: '', trim: true },
    description_ru: { type: String, default: '', trim: true },
    description_en: { type: String, default: '', trim: true },
    price: { type: Number, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    discount_percent: { type: Number, default: 0, min: 0, max: 100 },
    discountedPrice: { type: Number, default: null, min: 0 },
    mainImage: { type: String, default: null },
    gallery: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
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
    specifications: {
      type: specificationsSchema,
      default: () => ({}),
    },
    filters: {
      type: filtersSchema,
      default: () => ({}),
    },
    stock: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0, index: true },
    salesCount: { type: Number, default: 0, min: 0, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews_count: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFlashSale: { type: Boolean, default: false, index: true },
    flashSaleDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    flashSaleEndsAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: true, index: true },
    b2bOnly: { type: Boolean, default: false, index: true },
    wholesalePrice: { type: Number, default: null, min: 0 },
    bulkPackSize: { type: Number, default: 1, min: 1 },
    technicalSpecs: { type: String, default: '' },
    model3dUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

productSchema.index({
  name: 'text',
  name_uz: 'text',
  name_ru: 'text',
  name_en: 'text',
  sku: 'text',
  description: 'text',
  description_uz: 'text',
  description_ru: 'text',
  description_en: 'text',
})
productSchema.index({ 'filters.color': 1, 'filters.material': 1 })
productSchema.index({ rating: -1 })
productSchema.index({ price: 1, basePrice: 1 })
productSchema.index({ category: 1, isPublished: 1, createdAt: -1 })
productSchema.index({ category: 1, isActive: 1, stock: 1 })
productSchema.index({ salesCount: -1, rating: -1 })

productSchema.pre('save', function syncMultilingualFields(next) {
  if (this.name_uz?.trim()) {
    this.name = this.name_uz.trim()
  } else if (this.name?.trim() && !this.name_uz) {
    this.name_uz = this.name.trim()
  }

  if (this.description_uz?.trim() && !this.description) {
    this.description = this.description_uz.trim()
  } else if (this.description?.trim() && !this.description_uz) {
    this.description_uz = this.description.trim()
  }

  if (this.price != null && !Number.isNaN(this.price)) {
    this.basePrice = this.price
  } else if (this.basePrice != null && (this.price == null || Number.isNaN(this.price))) {
    this.price = this.basePrice
  }

  const discount = Number(this.discount_percent) || 0
  if (discount > 0 && this.basePrice != null) {
    this.discountedPrice = Math.round(this.basePrice * (1 - discount / 100))
  } else if (discount === 0 && this.discountedPrice == null) {
    /* keep explicit discountedPrice if set */
  }

  if (typeof this.isActive === 'boolean') {
    this.isPublished = this.isActive
  } else {
    this.isActive = this.isPublished !== false
  }

  if (!this.imageUrls?.length) {
    const urls = []
    if (this.mainImage) urls.push(this.mainImage)
    if (Array.isArray(this.gallery)) urls.push(...this.gallery.filter(Boolean))
    if (Array.isArray(this.images)) {
      for (const img of this.images) {
        if (img?.url) urls.push(img.url)
      }
    }
    if (urls.length) {
      this.imageUrls = [...new Set(urls)]
    }
  }

  const specs = this.specifications || {}
  if (specs.material_uz && !this.filters?.material) {
    this.filters = { ...this.filters?.toObject?.() || this.filters || {}, material: specs.material_uz }
  }
  if (specs.material_uz && !this.materials?.length) {
    this.materials = [specs.material_uz]
  }

  if (specs.dimensions) {
    const dims = this.dimensions?.toObject?.() || this.dimensions || {}
    this.dimensions = {
      ...dims,
      width: specs.dimensions.width ?? dims.width,
      height: specs.dimensions.height ?? dims.height,
      depth: specs.dimensions.length ?? dims.depth,
      length: specs.dimensions.length ?? dims.length,
    }
  }

  next()
})

export default mongoose.model('Product', productSchema)
