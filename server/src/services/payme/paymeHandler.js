import Order from '../../models/Order.js'
import Payment from '../../models/Payment.js'
import { PaymeGateway, PAYME_ERRORS, PAYME_STATES } from './PaymeGateway.js'
import { fulfillOrderPayment, cancelPendingOrder } from '../../utils/fulfillOrderPayment.js'
import { logPaymentEvent } from '../../utils/paymentLogger.js'
import { tiynToUzs, uzsToTiyn } from '../../config/payments.js'
import { getOrderPayableAmount } from '../../utils/orderAmount.js'

const gateway = new PaymeGateway()

async function findOrderByAccount(account) {
  const orderId = account?.order_id
  if (!orderId) return null
  return Order.findOne({
    $or: [{ _id: orderId }, { orderNumber: String(orderId) }],
  }).populate('customer', 'firstName lastName email')
}

async function findOrCreatePayment(order, transactionId, amountTiyn) {
  let payment = await Payment.findOne({ gateway: 'payme', transactionId: String(transactionId) })
  if (payment) return payment

  payment = await Payment.create({
    order: order._id,
    orderNumber: order.orderNumber,
    gateway: 'payme',
    transactionId: String(transactionId),
    amount: tiynToUzs(amountTiyn),
    amountTiyn,
    status: 'processing',
    paymeState: PAYME_STATES.CREATED,
  })
  return payment
}

export async function handlePaymeRpc(body, { ip = '', headers = {} } = {}) {
  const started = Date.now()
  const { id, method, params } = body || {}

  const logAndReturn = async (response, event, extra = {}) => {
    await logPaymentEvent({
      gateway: 'payme',
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

  if (!gateway.verifyAuth(headers.authorization)) {
    return logAndReturn(gateway.buildError(PAYME_ERRORS.AUTH_ERROR, null, id), 'auth_failed', {
      errorCode: String(PAYME_ERRORS.AUTH_ERROR.code),
    })
  }

  if (!gateway.isAllowedIp(ip)) {
    return logAndReturn(gateway.buildError(PAYME_ERRORS.AUTH_ERROR, null, id), 'ip_blocked', {
      errorCode: 'ip_blocked',
    })
  }

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        return logAndReturn(await checkPerformTransaction(params, id), 'CheckPerformTransaction')
      case 'CreateTransaction':
        return logAndReturn(await createTransaction(params, id), 'CreateTransaction')
      case 'PerformTransaction':
        return logAndReturn(await performTransaction(params, id), 'PerformTransaction')
      case 'CancelTransaction':
        return logAndReturn(await cancelTransaction(params, id), 'CancelTransaction')
      case 'CheckTransaction':
        return logAndReturn(await checkTransaction(params, id), 'CheckTransaction')
      case 'GetStatement':
        return logAndReturn(await getStatement(params, id), 'GetStatement')
      default:
        return logAndReturn(
          gateway.buildError(PAYME_ERRORS.METHOD_NOT_FOUND, null, id),
          'method_not_found',
          { errorCode: String(PAYME_ERRORS.METHOD_NOT_FOUND.code) }
        )
    }
  } catch (err) {
    console.error('[payme]', method, err.message)
    return logAndReturn(
      gateway.buildError(PAYME_ERRORS.UNABLE_TO_PERFORM, err.message, id),
      'exception',
      { errorMessage: err.message }
    )
  }
}

async function checkPerformTransaction(params, id) {
  const { amount, account } = params || {}
  const order = await findOrderByAccount(account)
  if (!order) return gateway.buildError(PAYME_ERRORS.ORDER_NOT_FOUND, null, id)
  if (order.paymentStatus === 'paid') return gateway.buildError(PAYME_ERRORS.ORDER_ALREADY_PAID, null, id)
  if (order.status === 'cancelled') return gateway.buildError(PAYME_ERRORS.ORDER_CANCELLED, null, id)
  if (Number(amount) !== uzsToTiyn(getOrderPayableAmount(order))) {
    return gateway.buildError(PAYME_ERRORS.INVALID_AMOUNT, null, id)
  }
  return gateway.buildResult({ allow: true }, id)
}

async function createTransaction(params, id) {
  const { id: transactionId, time, amount, account } = params || {}
  const order = await findOrderByAccount(account)
  if (!order) return gateway.buildError(PAYME_ERRORS.ORDER_NOT_FOUND, null, id)
  if (order.paymentStatus === 'paid') return gateway.buildError(PAYME_ERRORS.ORDER_ALREADY_PAID, null, id)
  if (Number(amount) !== uzsToTiyn(getOrderPayableAmount(order))) {
    return gateway.buildError(PAYME_ERRORS.INVALID_AMOUNT, null, id)
  }

  let payment = await Payment.findOne({ gateway: 'payme', transactionId: String(transactionId) })
  if (payment) {
    if (payment.paymeState === PAYME_STATES.CREATED) {
      return gateway.buildResult(
        {
          create_time: payment.metadata?.createTime || time,
          transaction: String(transactionId),
          state: PAYME_STATES.CREATED,
          receivers: null,
        },
        id
      )
    }
    return gateway.buildError(PAYME_ERRORS.UNABLE_TO_PERFORM, null, id)
  }

  payment = await findOrCreatePayment(order, transactionId, amount)
  payment.metadata = { ...payment.metadata, createTime: time }
  payment.paymeState = PAYME_STATES.CREATED
  await payment.save()

  return gateway.buildResult(
    {
      create_time: time,
      transaction: String(transactionId),
      state: PAYME_STATES.CREATED,
      receivers: null,
    },
    id
  )
}

async function performTransaction(params, id) {
  const { id: transactionId } = params || {}
  const payment = await Payment.findOne({ gateway: 'payme', transactionId: String(transactionId) })
  if (!payment) return gateway.buildError(PAYME_ERRORS.TRANSACTION_NOT_FOUND, null, id)

  if (payment.paymeState === PAYME_STATES.COMPLETED) {
    return gateway.buildResult(
      {
        transaction: String(transactionId),
        perform_time: payment.metadata?.performTime || Date.now(),
        state: PAYME_STATES.COMPLETED,
      },
      id
    )
  }

  if (payment.paymeState !== PAYME_STATES.CREATED) {
    return gateway.buildError(PAYME_ERRORS.UNABLE_TO_PERFORM, null, id)
  }

  const order = await Order.findById(payment.order)
  if (!order) return gateway.buildError(PAYME_ERRORS.ORDER_NOT_FOUND, null, id)
  if (Number(payment.amountTiyn) !== uzsToTiyn(getOrderPayableAmount(order))) {
    return gateway.buildError(PAYME_ERRORS.INVALID_AMOUNT, null, id)
  }

  const performTime = Date.now()
  payment.paymeState = PAYME_STATES.COMPLETED
  payment.status = 'paid'
  payment.paidAt = new Date(performTime)
  payment.metadata = { ...payment.metadata, performTime }
  await payment.save()

  await fulfillOrderPayment(order, { note: 'Payme PerformTransaction' })

  return gateway.buildResult(
    {
      transaction: String(transactionId),
      perform_time: performTime,
      state: PAYME_STATES.COMPLETED,
    },
    id
  )
}

async function cancelTransaction(params, id) {
  const { id: transactionId, reason } = params || {}
  const payment = await Payment.findOne({ gateway: 'payme', transactionId: String(transactionId) })
  if (!payment) return gateway.buildError(PAYME_ERRORS.TRANSACTION_NOT_FOUND, null, id)

  const cancelTime = Date.now()

  if (payment.paymeState === PAYME_STATES.CANCELLED_BEFORE || payment.paymeState === PAYME_STATES.CANCELLED_AFTER) {
    return gateway.buildResult(
      {
        transaction: String(transactionId),
        cancel_time: payment.metadata?.cancelTime || cancelTime,
        state: payment.paymeState,
      },
      id
    )
  }

  if (payment.paymeState === PAYME_STATES.COMPLETED) {
    if (reason !== 5) return gateway.buildError(PAYME_ERRORS.UNABLE_TO_PERFORM, null, id)
    payment.paymeState = PAYME_STATES.CANCELLED_AFTER
    payment.status = 'refunded'
    payment.refundAmount = payment.amount
    payment.refundedAt = new Date(cancelTime)
  } else {
    payment.paymeState = PAYME_STATES.CANCELLED_BEFORE
    payment.status = 'cancelled'
    payment.cancelledAt = new Date(cancelTime)
    const order = await Order.findById(payment.order)
    if (order) await cancelPendingOrder(order, { note: 'Payme CancelTransaction' })
  }

  payment.metadata = { ...payment.metadata, cancelTime, cancelReason: reason }
  await payment.save()

  return gateway.buildResult(
    {
      transaction: String(transactionId),
      cancel_time: cancelTime,
      state: payment.paymeState,
    },
    id
  )
}

async function checkTransaction(params, id) {
  const { id: transactionId } = params || {}
  const payment = await Payment.findOne({ gateway: 'payme', transactionId: String(transactionId) })
  if (!payment) return gateway.buildError(PAYME_ERRORS.TRANSACTION_NOT_FOUND, null, id)

  return gateway.buildResult(
    {
      create_time: payment.metadata?.createTime || payment.createdAt?.getTime(),
      perform_time: payment.metadata?.performTime || 0,
      cancel_time: payment.metadata?.cancelTime || 0,
      transaction: String(transactionId),
      state: payment.paymeState ?? PAYME_STATES.CREATED,
      reason: payment.metadata?.cancelReason ?? null,
    },
    id
  )
}

async function getStatement(params, id) {
  const { from, to } = params || {}
  const payments = await Payment.find({
    gateway: 'payme',
    createdAt: { $gte: new Date(from), $lte: new Date(to) },
  }).limit(500)

  const transactions = payments.map((p) => ({
    id: p.transactionId,
    time: p.metadata?.createTime || p.createdAt?.getTime(),
    amount: p.amountTiyn,
    account: { order_id: p.orderNumber },
    create_time: p.metadata?.createTime || p.createdAt?.getTime(),
    perform_time: p.metadata?.performTime || 0,
    cancel_time: p.metadata?.cancelTime || 0,
    transaction: p.transactionId,
    state: p.paymeState,
    reason: p.metadata?.cancelReason ?? null,
  }))

  return gateway.buildResult({ transactions }, id)
}
