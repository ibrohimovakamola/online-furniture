/** Client-side installment plan config — mirrors server/src/config/installmentPlans.js */
export const INSTALLMENT_PLAN_MONTHS = [3, 6, 12]

export const INSTALLMENT_MARKUP = {
  3: 0,
  6: 5,
  12: 12,
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100
}

export function calculateInstallmentPlan(baseAmount, planMonths) {
  const months = Number(planMonths)
  const markupPercent = INSTALLMENT_MARKUP[months]
  if (markupPercent == null) return null

  const amount = Number(baseAmount)
  if (!Number.isFinite(amount) || amount <= 0) return null

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

export function calculateAllInstallmentPlans(baseAmount) {
  return INSTALLMENT_PLAN_MONTHS.map((m) => calculateInstallmentPlan(baseAmount, m)).filter(Boolean)
}

export function formatInstallmentLabel(planMonths) {
  const markup = INSTALLMENT_MARKUP[planMonths]
  if (markup === 0) return `${planMonths} oy — 0% ustama`
  return `${planMonths} oy — ${markup}% ustama`
}
