/**
 * Uzum Bank payment service — Merchant API + checkout session creation.
 */
import UzumGateway from './uzum/UzumGateway.js'
import { handleUzumWebhook } from './uzum/uzumHandler.js'
import Payment from '../models/Payment.js'
import { uzumBankConfig } from '../config/payments.js'

const gateway = new UzumGateway()

export { UzumGateway, handleUzumWebhook }
export { UZUM_ERRORS, UZUM_STATES } from './uzum/UzumGateway.js'

export async function createUzumPayment({ orderId, orderNumber, amountUzs, returnUrl, description }) {
  if (!gateway.isConfigured()) {
    throw new Error('Uzum Bank is not configured')
  }

  const session = await gateway.createPaymentSession({
    orderId,
    amountUzs,
    returnUrl,
    description,
  })

  await Payment.findOneAndUpdate(
    {
      order: orderId,
      gateway: 'uzumbank',
      status: { $in: ['pending', 'processing'] },
    },
    {
      order: orderId,
      orderNumber,
      gateway: 'uzumbank',
      transactionId: session.transactionId || '',
      externalId: session.externalId || '',
      amount: amountUzs,
      currency: 'UZS',
      status: 'pending',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return session.paymentUrl
}

export async function getUzumTransactionStatus(transactionId) {
  const payment = await Payment.findOne({
    gateway: 'uzumbank',
    $or: [{ transactionId: String(transactionId) }, { externalId: String(transactionId) }],
  }).populate('order', 'orderNumber paymentStatus status')

  if (!payment) {
    return { found: false, transactionId: String(transactionId) }
  }

  return {
    found: true,
    transactionId: payment.transactionId,
    paymentId: String(payment._id),
    orderId: String(payment.order?._id || payment.order),
    orderNumber: payment.orderNumber,
    status: payment.status,
    amount: payment.amount,
    paidAt: payment.paidAt,
    orderPaymentStatus: payment.order?.paymentStatus,
    uzumState: payment.metadata?.uzumState,
  }
}

export function generateUzumCheckout(orderId, amountUzs, description, options = {}) {
  return gateway.generatePaymentUrl({
    orderId,
    amountUzs,
    returnUrl: options.returnUrl,
    description,
  })
}

export function isUzumConfigured() {
  return gateway.isConfigured()
}

export function getUzumConfig() {
  return {
    configured: gateway.isConfigured(),
    testMode: uzumBankConfig.testMode,
    apiUrl: uzumBankConfig.apiUrl,
  }
}
