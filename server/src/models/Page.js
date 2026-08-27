import mongoose from 'mongoose'

const localeFieldsSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    description: { type: String, default: '', trim: true },
    seoTitle: { type: String, default: '', trim: true },
  },
  { _id: false }
)

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
    /** @deprecated Prefer `status`; kept in sync for public API compatibility */
    published: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    seoTitle: { type: String, default: '', trim: true, maxlength: 70 },
    focusKeyword: { type: String, default: '', trim: true, maxlength: 120 },
    featuredImage: { type: String, default: '', trim: true },
    ogTitle: { type: String, default: '', trim: true, maxlength: 120 },
    ogDescription: { type: String, default: '', trim: true, maxlength: 300 },
    ogImage: { type: String, default: '', trim: true },
    template: {
      type: String,
      enum: ['default', 'full-width', 'legal', 'landing'],
      default: 'default',
    },
    /** Optional per-language overrides; public storefront still uses title/content */
    translations: {
      uz: { type: localeFieldsSchema, default: () => ({}) },
      ru: { type: localeFieldsSchema, default: () => ({}) },
      en: { type: localeFieldsSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
)

pageSchema.pre('validate', function syncPublished(next) {
  if (this.status) {
    this.published = this.status === 'published'
  } else if (typeof this.published === 'boolean') {
    this.status = this.published ? 'published' : 'draft'
  }
  next()
})

export default mongoose.model('Page', pageSchema)
