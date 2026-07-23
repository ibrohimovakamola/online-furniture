/** B2B partner configuration — pricing tiers, credit terms, verification statuses */

export const B2B_STATUSES = ['pending', 'under_review', 'verified', 'rejected']

export const B2B_COMPANY_TYPES = [
  'interior_designer',
  'contractor',
  'retailer',
  'distributor',
  'other',
  // legacy values kept for existing records
  'construction',
  'hotel_hospitality',
]

export const B2B_TURNOVER_RANGES = [
  'under_500m',
  '500m_2b',
  '2b_10b',
  '10b_50b',
  'over_50b',
]

export const B2B_EMPLOYEE_RANGES = ['1_5', '6_20', '21_50', '51_200', 'over_200']

export const B2B_ACCOUNT_MANAGERS = [
  {
    id: 'dilnoza',
    name: 'Dilnoza Karimova',
    title: 'B2B Account Manager',
    email: 'b2b@kresla.uz',
    phone: '+998 90 123 45 67',
    whatsapp: '+998901234567',
    photoUrl: '',
    responseGuaranteeHours: 2,
  },
  {
    id: 'sardor',
    name: 'Sardor Rakhimov',
    title: 'Senior B2B Consultant',
    email: 'sardor.b2b@kresla.uz',
    phone: '+998 91 234 56 78',
    whatsapp: '+998912345678',
    photoUrl: '',
    responseGuaranteeHours: 4,
  },
  {
    id: 'nilufar',
    name: 'Nilufar Tosheva',
    title: 'Project Partnerships',
    email: 'nilufar.b2b@kresla.uz',
    phone: '+998 93 456 78 90',
    whatsapp: '+998934567890',
    photoUrl: '',
    responseGuaranteeHours: 4,
  },
]

export function getAccountManagerById(id) {
  return B2B_ACCOUNT_MANAGERS.find((m) => m.id === id) || B2B_ACCOUNT_MANAGERS[0]
}

export const DEFAULT_ACCOUNT_MANAGER = B2B_ACCOUNT_MANAGERS[0]

export const B2B_CREDIT_TERMS = ['prepay', 'net30', 'net60']

/** Default wholesale discount off retail when no explicit wholesale price is set */
export const DEFAULT_WHOLESALE_DISCOUNT_PERCENT = 15

/** Quantity-based discount tiers applied on top of wholesale price */
export const QUANTITY_DISCOUNT_TIERS = [
  { minQty: 1, percent: 0 },
  { minQty: 5, percent: 5 },
  { minQty: 10, percent: 10 },
  { minQty: 25, percent: 15 },
  { minQty: 50, percent: 20 },
]

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
