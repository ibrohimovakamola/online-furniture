import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    store: {
      supportPhone: { type: String, default: '+998 94 043 16 84' },
      storeEmail: { type: String, default: 'exclusive@gmail.com' },
      address: { type: String, default: 'Tashkent, Uzbekistan' },
      telegram: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    banner: {
      eyebrow: { type: String, default: 'Furniture for living room' },
      title: { type: String, default: 'Yangi kolleksiya – 10% gacha chegirma' },
      discountPercent: { type: Number, default: 10, min: 0, max: 100 },
      ctaText: { type: String, default: 'Buyurtma berish' },
      ctaLink: { type: String, default: '/products' },
      backgroundImage: { type: String, default: null },
    },
    shipping: {
      defaultShippingFee: { type: Number, default: 0, min: 0 },
      freeShippingThreshold: { type: Number, default: 500, min: 0 },
    },
    flashSale: {
      enabled: { type: Boolean, default: false },
      showOnHomepage: { type: Boolean, default: true },
      endsAt: { type: Date, default: null },
      title: { type: String, default: 'Flash Sales' },
    },
  },
  { timestamps: true }
)

export default mongoose.model('Settings', settingsSchema)
