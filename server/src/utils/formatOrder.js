export function formatOrder(order) {
  const doc = order.toObject ? order.toObject() : order
  const customer = doc.customer

  const guestName = doc.guest?.name || doc.shippingAddress?.fullName || ''
  const guestEmail = doc.guest?.email || doc.shippingAddress?.email || ''

  const paymentStatus =
    doc.paymentStatus === 'pending' || doc.paymentStatus === 'awaiting'
      ? 'unpaid'
      : doc.paymentStatus

  return {
    id: doc._id,
    orderId: String(doc._id),
    orderNumber: doc.orderNumber,
    userId: doc.customer ? String(doc.customer._id || doc.customer) : null,
    isGuest: Boolean(doc.isGuest),
    customerName: customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : guestName || 'Unknown',
    customerEmail: customer?.email || guestEmail,
    date: doc.createdAt,
    total: doc.finalPrice ?? doc.total,
    totalPrice: doc.totalPrice ?? doc.subtotal,
    discount_amount: doc.discount_amount ?? 0,
    finalPrice: doc.finalPrice ?? doc.total,
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    serviceFees: doc.serviceFees,
    paymentMethod: doc.paymentMethod,
    paymentStatus,
    status: doc.status,
    items: (doc.items || []).map((item) => ({
      productId: item.productId || item.product,
      productName_uz: item.productName_uz || item.name,
      productName_ru: item.productName_ru || '',
      productName_en: item.productName_en || '',
      name: item.name,
      quantity: item.quantity,
      price: item.price ?? item.unitPrice,
      subtotal: item.subtotal ?? item.lineTotal,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      color: item.color || '',
    })),
    shippingAddress: doc.shippingAddress,
    notes: doc.notes || doc.orderNotes || '',
    premiumServices: doc.premiumServices,
    installmentDetails: doc.installmentDetails || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Checkout success payload for payment redirect */
export function formatOrderCheckoutResponse(order, paymentUrl = null) {
  const formatted = formatOrder(order)
  return {
    orderId: formatted.orderId,
    orderNumber: formatted.orderNumber,
    totalPrice: formatted.totalPrice,
    discount_amount: formatted.discount_amount,
    finalPrice: formatted.finalPrice,
    status: formatted.status,
    paymentStatus: formatted.paymentStatus,
    paymentMethod: formatted.paymentMethod,
    paymentUrl: paymentUrl || null,
  }
}

/** Public guest tracking view — omits internal fields */
export function formatGuestOrder(order) {
  const base = formatOrder(order)
  return {
    id: base.id,
    orderNumber: base.orderNumber,
    status: base.status,
    paymentStatus: base.paymentStatus,
    paymentMethod: base.paymentMethod,
    total: base.finalPrice,
    totalPrice: base.totalPrice,
    discount_amount: base.discount_amount,
    finalPrice: base.finalPrice,
    subtotal: base.subtotal,
    shippingCost: base.shippingCost,
    serviceFees: base.serviceFees,
    items: base.items,
    shippingAddress: base.shippingAddress,
    notes: base.notes,
    premiumServices: base.premiumServices,
    guest: order.guest
      ? { name: order.guest.name, email: order.guest.email, phone: order.guest.phone }
      : null,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  }
}
