export const PREMIUM_SERVICE_FEES = {
  deliveryToFloor: 49,
  professionalAssembly: 79,
}

export function calculatePremiumServiceFees(premiumServices = {}) {
  let total = 0
  const breakdown = {}

  if (premiumServices.deliveryToFloor) {
    breakdown.deliveryToFloor = PREMIUM_SERVICE_FEES.deliveryToFloor
    total += PREMIUM_SERVICE_FEES.deliveryToFloor
  }
  if (premiumServices.professionalAssembly) {
    breakdown.professionalAssembly = PREMIUM_SERVICE_FEES.professionalAssembly
    total += PREMIUM_SERVICE_FEES.professionalAssembly
  }

  return { total, breakdown }
}
