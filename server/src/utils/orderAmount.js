/** Payable order total in UZS (prefers finalPrice from cart checkout). */
export function getOrderPayableAmount(order, { forGateway = false } = {}) {
  if (!order) return 0

  if (forGateway && order.paymentMethod === 'installment' && order.installmentDetails) {
    const details = order.installmentDetails
    if (details.paidMonths < details.planMonths) {
      return Number(details.monthlyPayment) || 0
    }
  }

  const amount = order.finalPrice ?? order.total ?? order.totalPrice ?? order.subtotal
  return Number(amount) || 0
}

export function amountsMatch(expectedUzs, receivedUzs, tolerance = 0.01) {
  return Math.abs(Number(expectedUzs) - Number(receivedUzs)) <= tolerance
}
