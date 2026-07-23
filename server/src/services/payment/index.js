/**
 * Unified Payme & Click gateway helpers for mebelsotish.uz
 */
import Payment from '../../models/Payment.js'
import PaymeGateway, { PAYME_STATES } from '../payme/PaymeGateway.js'
import ClickGateway from '../click/ClickGateway.js'
import UzumGateway from '../uzum/UzumGateway.js'
import { handlePaymeRpc } from '../payme/paymeHandler.js'
import { handleClickCallback } from '../click/clickHandler.js'
import { handleUzumWebhook } from '../uzum/uzumHandler.js'
import { createUzumPayment, getUzumTransactionStatus } from '../uzumBankService.js'

const paymeGateway = new PaymeGateway()
const clickGateway = new ClickGateway()
const uzumGateway = new UzumGateway()

/** @alias generatePaymentUrl */
export function generatePaymeCheckout(orderId, amountUzs, description, options = {}) {
  return paymeGateway.generatePaymentUrl({
    orderId: String(orderId),
    amountUzs: Number(amountUzs),
    returnUrl: options.returnUrl,
    lang: options.lang || 'uz',
    description,
  })
}

/** Verify Payme Merchant API webhook (JSON-RPC + Basic auth + amount checks inside handler). */
export async function verifyPaymeCallback(request, context = {}) {
  const body = request.body ?? request
  const headers = request.headers ?? context.headers ?? {}
  const ip = context.ip ?? request.ip ?? ''
  return handlePaymeRpc(body, { ip, headers })
}

/** Lookup Payme transaction status from Payment record. */
export async function getPaymeTransactionStatus(transactionId) {
  const payment = await Payment.findOne({
    gateway: 'payme',
    transactionId: String(transactionId),
  }).populate('order', 'orderNumber paymentStatus status finalPrice total')

  if (!payment) {
    return { found: false, transactionId: String(transactionId) }
  }

  return {
    found: true,
    transactionId: payment.transactionId,
    paymentId: String(payment._id),
    orderId: String(payment.order?._id || payment.order),
    orderNumber: payment.orderNumber,
    state: payment.paymeState,
    status: payment.status,
    amount: payment.amount,
    paidAt: payment.paidAt,
    orderPaymentStatus: payment.order?.paymentStatus,
    orderStatus: payment.order?.status,
    isCompleted: payment.paymeState === PAYME_STATES.COMPLETED,
  }
}

export function generateClickCheckout(orderId, amountUzs, description, options = {}) {
  return clickGateway.generatePaymentUrl({
    orderId: String(orderId),
    amountUzs: Number(amountUzs),
    returnUrl: options.returnUrl,
    description,
  })
}

/** Verify Click prepare/complete callback (MD5 signature + amount validation). */
export async function verifyClickCallback(request, context = {}) {
  const query = { ...(request.query || {}), ...(request.body || {}), ...request }
  const ip = context.ip ?? request.ip ?? ''
  const headers = context.headers ?? request.headers ?? {}
  return handleClickCallback(query, { ip, headers })
}

/** Lookup Click transaction status from Payment record (+ optional live API). */
export async function getClickTransactionStatus(clickTransactionId) {
  const payment = await Payment.findOne({
    gateway: 'click',
    $or: [{ transactionId: String(clickTransactionId) }, { externalId: String(clickTransactionId) }],
  }).populate('order', 'orderNumber paymentStatus status finalPrice total')

  if (!payment) {
    return { found: false, clickTransactionId: String(clickTransactionId) }
  }

  let remoteStatus = null
  if (clickGateway.isConfigured()) {
    remoteStatus = await clickGateway.fetchTransactionStatus(clickTransactionId)
  }

  return {
    found: true,
    clickTransactionId: payment.transactionId,
    paymentId: String(payment._id),
    orderId: String(payment.order?._id || payment.order),
    orderNumber: payment.orderNumber,
    status: payment.status,
    amount: payment.amount,
    paidAt: payment.paidAt,
    orderPaymentStatus: payment.order?.paymentStatus,
    orderStatus: payment.order?.status,
    remote: remoteStatus,
  }
}

export { paymeGateway, clickGateway, uzumGateway }

export async function generateUzumCheckout(orderId, amountUzs, description, options = {}) {
  return createUzumPayment({
    orderId,
    orderNumber: options.orderNumber || '',
    amountUzs: Number(amountUzs),
    returnUrl: options.returnUrl,
    description,
  })
}

export async function verifyUzumCallback(request, context = {}) {
  const body = request.body ?? request
  const headers = request.headers ?? context.headers ?? {}
  const ip = context.ip ?? request.ip ?? ''
  return handleUzumWebhook(body, { ip, headers })
}

export { getUzumTransactionStatus }
