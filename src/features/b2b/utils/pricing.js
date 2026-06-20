/** Mirrors server/src/config/b2b.js quantity tiers */
export const QUANTITY_DISCOUNT_TIERS = [
  { minQty: 1, percent: 0, label: '1–4 units' },
  { minQty: 5, percent: 5, label: '5–9 units' },
  { minQty: 10, percent: 10, label: '10–24 units' },
  { minQty: 25, percent: 15, label: '25–49 units' },
  { minQty: 50, percent: 20, label: '50+ units' },
]

export const DEFAULT_WHOLESALE_DISCOUNT_PERCENT = 15

export function getQuantityDiscountPercent(quantity) {
  const qty = Math.max(Number(quantity) || 0, 0)
  let percent = 0
  for (const tier of QUANTITY_DISCOUNT_TIERS) {
    if (qty >= tier.minQty) percent = tier.percent
  }
  return percent
}

export function calculateB2BLinePrice({ retailPrice, wholesalePrice, quantity = 1 }) {
  const retail = Math.max(Number(retailPrice) || 0, 0)
  const baseWholesale =
    wholesalePrice != null && wholesalePrice > 0
      ? Number(wholesalePrice)
      : Math.round(retail * (1 - DEFAULT_WHOLESALE_DISCOUNT_PERCENT / 100))

  const qty = Math.max(Number(quantity) || 1, 1)
  const extraDiscount = getQuantityDiscountPercent(qty)
  const unitPrice = Math.round(baseWholesale * (1 - extraDiscount / 100))
  const lineTotal = unitPrice * qty
  const retailTotal = retail * qty
  const savings = Math.max(retailTotal - lineTotal, 0)

  return {
    retailUnit: retail,
    wholesaleUnit: baseWholesale,
    quantity: qty,
    extraDiscountPercent: extraDiscount,
    unitPrice,
    lineTotal,
    retailTotal,
    savings,
  }
}
