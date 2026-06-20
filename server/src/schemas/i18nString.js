import mongoose from 'mongoose'

/** Reusable { en, ru, uz } map for multilingual DB fields */
export const i18nStringSchema = new mongoose.Schema(
  {
    en: { type: String, trim: true, default: '' },
    ru: { type: String, trim: true, default: '' },
    uz: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

/**
 * Mongoose field that accepts either a plain string or { en, ru, uz }.
 * Existing documents with string values keep working.
 */
export function i18nField(options = {}) {
  return {
    type: mongoose.Schema.Types.Mixed,
    ...options,
  }
}
