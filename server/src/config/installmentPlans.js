/** Supported installment plan lengths (months) */
export const INSTALLMENT_PLAN_MONTHS = [3, 6, 12]

/** Markup percentage applied to the order subtotal (incl. shipping & services) */
export const INSTALLMENT_MARKUP = {
  3: 0,
  6: 5,
  12: 12,
}

export function isValidPlanMonths(months) {
  return INSTALLMENT_PLAN_MONTHS.includes(Number(months))
}

export function getMarkupPercent(planMonths) {
  return INSTALLMENT_MARKUP[Number(planMonths)] ?? null
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100
}

/**
 * Calculate installment breakdown for a given base amount and plan length.
 * @param {number} baseAmount — product subtotal + shipping + service fees
 * @param {number} planMonths — 3, 6, or 12
 */
export function calculateInstallmentPlan(baseAmount, planMonths) {
  const months = Number(planMonths)
  if (!isValidPlanMonths(months)) {
    throw new Error('Invalid installment plan. Choose 3, 6, or 12 months.')
  }

  const amount = Number(baseAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('A valid order total is required to calculate installment plans.')
  }

  const markupPercent = getMarkupPercent(months)
  const markupAmount = roundCurrency(amount * (markupPercent / 100))
  const totalAmountWithInterest = roundCurrency(amount + markupAmount)
  const monthlyPayment = roundCurrency(totalAmountWithInterest / months)

  return {
    planMonths: months,
    markupPercent,
    baseAmount: roundCurrency(amount),
    markupAmount,
    monthlyPayment,
    totalAmountWithInterest,
  }
}

/** Build all available plans for a given base amount */
export function calculateAllInstallmentPlans(baseAmount) {
  return INSTALLMENT_PLAN_MONTHS.map((months) => calculateInstallmentPlan(baseAmount, months))
}

/** First payment due 30 days after order placement */
export function getInitialNextPaymentDate(fromDate = new Date()) {
  const next = new Date(fromDate)
  next.setMonth(next.getMonth() + 1)
  return next
}
