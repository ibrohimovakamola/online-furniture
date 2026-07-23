import Order from '../../models/Order.js'
import Payment from '../../models/Payment.js'
import { UzumGateway, UZUM_ERRORS, UZUM_STATES } from './UzumGateway.js'
import {
  fulfillOrderPayment,
  fulfillInstallmentGatewayPayment,
} from '../../utils/fulfillOrderPayment.js'
import { logPaymentEvent } from '../../utils/paymentLogger.js'
import { getOrderPayableAmount, amountsMatch } from '../../utils/orderAmount.js'

const gateway = new UzumGateway()

async function findOrder(orderId) {
  if (!orderId) return null
  return Order.findOne({
    $or: [{ _id: orderId }, { orderNumber: String(orderId) }],
  }).populate('customer', 'firstName lastName email')
}

function resolveMethod(body) {
  return String(body?.method || body?.action || body?.type || '').toLowerCase()
}

export async function handleUzumWebhook(body, { ip = '', headers = {} } = {}) {
  const started = Date.now()
  const method = resolveMethod(body)
  const params = body?.params || body?.data || body

  const logAndReturn = async (response, event, extra = {}) => {
    await logPaymentEvent({
      gateway: 'uzumbank',
      direction: 'inbound',
      event,
      requestIp: ip,
      requestHeaders: headers,
      requestBody: body,
      responseBody: response,
      durationMs: Date.now() - started,
      ...extra,
    })
    return response
  }

  if (!gateway.verifyAuth(headers.authorization || headers.Authorization)) {
    const signature = headers['x-signature'] || headers['X-Signature']
    if (!signature || !gateway.verifyCallbackSignature(body, signature)) {
      return logAndReturn(gateway.buildError(UZUM_ERRORS.AUTH_ERROR), 'auth_failed')
    }
  }

  switch (method) {
    case 'check':
      return handleCheck(params, logAndReturn)
    case 'create':
      return handleCreate(params, logAndReturn)
    case 'confirm':
      return handleConfirm(params, logAndReturn)
    case 'reverse':
      return handleReverse(params, logAndReturn)
    case 'status':
      return handleStatus(params, logAndReturn)
    default:
      return logAndReturn(gateway.buildError(UZUM_ERRORS.UNABLE_TO_PERFORM), 'unknown_method')
  }
}

async function handleCheck(params, logAndReturn) {
  const order = await findOrder(params.order_id || params.orderId)
  if (!order) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.ORDER_NOT_FOUND), 'order_not_found')
  }

  if (order.status === 'cancelled') {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.ORDER_CANCELLED), 'order_cancelled')
  }

  if (order.paymentStatus === 'paid' && order.paymentMethod !== 'installment') {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.ALREADY_PAID), 'already_paid')
  }

  const expected = getOrderPayableAmount(order, { forGateway: true })
  const received = Number(params.amount) / 100 || Number(params.amount_uzs) || Number(params.amount)

  if (!amountsMatch(expected, received)) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.INVALID_AMOUNT), 'amount_mismatch')
  }

  return logAndReturn(
    gateway.buildSuccess({
      order_id: String(order._id),
      amount: Math.round(expected * 100),
      state: UZUM_STATES.CREATED,
    }),
    'check_ok'
  )
}

async function handleCreate(params, logAndReturn) {
  const order = await findOrder(params.order_id || params.orderId)
  if (!order) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.ORDER_NOT_FOUND), 'order_not_found')
  }

  const transactionId = String(params.transaction_id || params.transactionId || '')
  const amountUzs =
    Number(params.amount) / 100 || Number(params.amount_uzs) || getOrderPayableAmount(order, { forGateway: true })

  await Payment.findOneAndUpdate(
    { order: order._id, gateway: 'uzumbank', transactionId },
    {
      order: order._id,
      orderNumber: order.orderNumber,
      gateway: 'uzumbank',
      transactionId,
      externalId: String(params.payment_id || params.paymentId || ''),
      amount: amountUzs,
      currency: 'UZS',
      status: 'processing',
      metadata: { uzumState: UZUM_STATES.CREATED },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return logAndReturn(
    gateway.buildSuccess({
      transaction_id: transactionId,
      order_id: String(order._id),
      state: UZUM_STATES.CREATED,
    }),
    'create_ok'
  )
}

async function handleConfirm(params, logAndReturn) {
  const order = await findOrder(params.order_id || params.orderId)
  if (!order) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.ORDER_NOT_FOUND), 'order_not_found')
  }

  const transactionId = String(params.transaction_id || params.transactionId || '')

  const payment = await Payment.findOneAndUpdate(
    { order: order._id, gateway: 'uzumbank', transactionId },
    {
      status: 'paid',
      paidAt: new Date(),
      metadata: { uzumState: UZUM_STATES.COMPLETED },
    },
    { new: true }
  )

  if (!payment) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.TRANSACTION_NOT_FOUND), 'tx_not_found')
  }

  if (order.paymentMethod === 'installment') {
    await fulfillInstallmentGatewayPayment(order, {
      note: `Uzum Bank installment payment confirmed (${transactionId})`,
      gateway: 'uzumbank',
    })
  } else {
    await fulfillOrderPayment(order, {
      note: `Uzum Bank payment confirmed (${transactionId})`,
    })
  }

  return logAndReturn(
    gateway.buildSuccess({
      transaction_id: transactionId,
      order_id: String(order._id),
      state: UZUM_STATES.COMPLETED,
    }),
    'confirm_ok',
    { paymentId: payment._id, orderId: order._id }
  )
}

async function handleReverse(params, logAndReturn) {
  const transactionId = String(params.transaction_id || params.transactionId || '')
  const payment = await Payment.findOne({ gateway: 'uzumbank', transactionId })

  if (!payment) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.TRANSACTION_NOT_FOUND), 'tx_not_found')
  }

  payment.status = 'cancelled'
  payment.cancelledAt = new Date()
  payment.metadata = { ...(payment.metadata || {}), uzumState: UZUM_STATES.CANCELLED }
  await payment.save()

  return logAndReturn(
    gateway.buildSuccess({ transaction_id: transactionId, state: UZUM_STATES.CANCELLED }),
    'reverse_ok'
  )
}

async function handleStatus(params, logAndReturn) {
  const transactionId = String(params.transaction_id || params.transactionId || '')
  const payment = await Payment.findOne({ gateway: 'uzumbank', transactionId }).populate('order')

  if (!payment) {
    return logAndReturn(gateway.buildError(UZUM_ERRORS.TRANSACTION_NOT_FOUND), 'tx_not_found')
  }

  return logAndReturn(
    gateway.buildSuccess({
      transaction_id: transactionId,
      order_id: String(payment.order?._id || payment.order),
      state: payment.metadata?.uzumState || (payment.status === 'paid' ? UZUM_STATES.COMPLETED : UZUM_STATES.CREATED),
      status: payment.status,
    }),
    'status_ok'
  )
}
