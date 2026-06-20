import mongoose from 'mongoose'

/**
 * Product category with multilingual names and descriptions (uz / ru / en).
 * `name` and `description` are kept for backward compatibility with admin UI and seeds.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    name_uz: { type: String, default: '', trim: true },
    name_ru: { type: String, default: '', trim: true },
    name_en: { type: String, default: '', trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    description_uz: { type: String, default: '', trim: true },
    description_ru: { type: String, default: '', trim: true },
    description_en: { type: String, default: '', trim: true },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

categorySchema.pre('save', function syncLegacyFields(next) {
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

  next()
})

/** Prefer localized name; fall back to legacy `name` field */
categorySchema.methods.getLocalizedName = function getLocalizedName(lang = 'uz') {
  const key = `name_${lang}`
  return this[key]?.trim() || this.name
}

categorySchema.methods.getLocalizedDescription = function getLocalizedDescription(lang = 'uz') {
  const key = `description_${lang}`
  return this[key]?.trim() || this.description || ''
}

export default mongoose.model('Category', categorySchema)
