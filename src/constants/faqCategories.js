export const FAQ_CATEGORY_OPTIONS = [
  { id: 'general', title: 'Mahsulot' },
  { id: 'shipping', title: 'Yetkazib berish' },
  { id: 'payment', title: 'To\'lov' },
  { id: 'returns', title: 'Kafolat va qaytarish' },
]

export const FAQ_CATEGORY_LABELS = Object.fromEntries(
  FAQ_CATEGORY_OPTIONS.map((c) => [c.id, c.title])
)
