/** Premium delivery & assembly — mirrored on server checkout */
export const PREMIUM_SERVICE_FEES = {
  deliveryToFloor: 49,
  professionalAssembly: 79,
}

export const PREMIUM_SERVICE_LABELS = {
  deliveryToFloor: {
    id: 'deliveryToFloor',
    title: "Uygacha yetkazib berish va qavatga olib chiqish",
    description: 'Toshkent shahri ichida xavfsiz yetkazish va qavatga ko‘tarish',
    fee: PREMIUM_SERVICE_FEES.deliveryToFloor,
  },
  professionalAssembly: {
    id: 'professionalAssembly',
    title: "Professional yig'ib berish va o'rnatish xizmati",
    description: 'Mutaxassislar tomonidan yig‘ish va joylashtirish',
    fee: PREMIUM_SERVICE_FEES.professionalAssembly,
  },
}

export const DEFAULT_MATERIAL_OPTIONS = [
  'Premium Velvet',
  'Natural Leather',
  'Turkiya matosi',
  'Linen Blend',
  'Microfiber',
]
