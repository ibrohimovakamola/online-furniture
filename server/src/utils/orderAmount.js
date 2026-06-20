/** Payable order total in UZS (prefers finalPrice from cart checkout). */
export function getOrderPayableAmount(order) {
  if (!order) return 0
  const amount = order.finalPrice ?? order.total ?? order.totalPrice ?? order.subtotal
  return Number(amount) || 0
}

export function amountsMatch(expectedUzs, receivedUzs, tolerance = 0.01) {
  return Math.abs(Number(expectedUzs) - Number(receivedUzs)) <= tolerance
}
