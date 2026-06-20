import { ValidationError, asyncHandler } from '../utils/asyncHandler.js'
import { calculateAllInstallmentPlans } from '../config/installmentPlans.js'

/**
 * GET /api/orders/installment-plans?total=1500000
 * Returns available installment plans for a given order total.
 */
export const getInstallmentPlans = asyncHandler(async (req, res) => {
  const total = Number(req.query.total)

  if (!Number.isFinite(total) || total <= 0) {
    throw new ValidationError('Query parameter "total" must be a positive number')
  }

  const plans = calculateAllInstallmentPlans(total)

  res.json({ success: true, baseAmount: total, plans })
})
