import { isFlashSaleActive } from './settingsHelper.js'

export function computeFlashSalePrice(basePrice, discountPercent) {
  const base = Number(basePrice) || 0
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

export function resolveProductFlashSale(product, globalConfig = {}) {
  const doc = product.toObject ? product.toObject() : product
  const globalActive = isFlashSaleActive(globalConfig)
  const endsAt = doc.flashSaleEndsAt || globalConfig.endsAt
  const expired = endsAt ? new Date(endsAt) <= new Date() : false

  if (!globalActive || !doc.isFlashSale || expired) {
    return {
      isFlashSale: false,
      flashSaleDiscountPercent: 0,
      flashSalePrice: null,
      flashSaleEndsAt: endsAt,
    }
  }

  const pct = doc.flashSaleDiscountPercent || 0
  return {
    isFlashSale: true,
    flashSaleDiscountPercent: pct,
    flashSalePrice: computeFlashSalePrice(doc.basePrice, pct),
    flashSaleEndsAt: endsAt,
  }
}
