import Settings from '../models/Settings.js'
import { buildImageUrl } from './helpers.js'

export const DEFAULT_SETTINGS = {
  store: {
    supportPhone: '+998 94 043 16 84',
    storeEmail: 'exclusive@gmail.com',
    address: 'Tashkent, Uzbekistan',
    telegram: '',
    instagram: '',
  },
  banner: {
    eyebrow: 'Furniture for living room',
    title: 'Yangi kolleksiya – 10% gacha chegirma',
    discountPercent: 10,
    ctaText: 'Buyurtma berish',
    ctaLink: '/products',
    backgroundImage: null,
  },
  shipping: {
    defaultShippingFee: 0,
    freeShippingThreshold: 500,
  },
  flashSale: {
    enabled: false,
    showOnHomepage: true,
    endsAt: null,
    title: 'Flash Sales',
  },
}

export function isFlashSaleActive(flashSaleConfig = {}) {
  if (!flashSaleConfig?.enabled) return false
  if (!flashSaleConfig.endsAt) return true
  return new Date(flashSaleConfig.endsAt) > new Date()
}

export function getFlashSaleTimeLeft(endsAt) {
  if (!endsAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
  const totalMs = Math.max(0, new Date(endsAt).getTime() - Date.now())
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60)
  const seconds = Math.floor((totalMs / 1000) % 60)
  return { days, hours, minutes, seconds, totalMs }
}

export async function getOrCreateSettings() {
  let doc = await Settings.findOne({ key: 'global' })
  if (!doc) {
    doc = await Settings.create({ key: 'global', ...DEFAULT_SETTINGS })
  }
  return doc
}

export function formatSettings(doc, req) {
  const s = doc.toObject ? doc.toObject() : doc
  const bg = s.banner?.backgroundImage

  return {
    store: { ...DEFAULT_SETTINGS.store, ...s.store },
    banner: {
      ...DEFAULT_SETTINGS.banner,
      ...s.banner,
      backgroundImageUrl: bg ? buildImageUrl(bg, req) : null,
    },
    shipping: { ...DEFAULT_SETTINGS.shipping, ...s.shipping },
    flashSale: {
      ...DEFAULT_SETTINGS.flashSale,
      ...s.flashSale,
      endsAt: s.flashSale?.endsAt ?? null,
      isActive: isFlashSaleActive({ ...DEFAULT_SETTINGS.flashSale, ...s.flashSale }),
      timeLeft: getFlashSaleTimeLeft(s.flashSale?.endsAt),
    },
    updatedAt: s.updatedAt,
  }
}

export function calculateShippingCost(subtotal, shippingConfig = {}) {
  const fee = Number(shippingConfig.defaultShippingFee) || 0
  const threshold = Number(shippingConfig.freeShippingThreshold) || 0

  if (threshold > 0 && subtotal >= threshold) return 0
  return fee
}
