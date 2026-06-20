import Order from '../../models/Order.js'
import Payment from '../../models/Payment.js'
import { ClickGateway, CLICK_ERRORS } from './ClickGateway.js'
import { fulfillOrderPayment, cancelPendingOrder } from '../../utils/fulfillOrderPayment.js'
import { logPaymentEvent } from '../../utils/paymentLogger.js'
import { getOrderPayableAmount, amountsMatch } from '../../utils/orderAmount.js'

const gateway = new ClickGateway()

async function findOrder(merchantTransId) {
  if (!merchantTransId) return null
  return Order.findOne({
    $or: [{ _id: merchantTransId }, { orderNumber: String(merchantTransId) }],
  }).populate('customer', 'firstName lastName email')
}

export async function handleClickCallback(query, { ip = '', headers = {} } = {}) {
  const started = Date.now()
  const params = { ...query }
  const action = Number(params.action)

  const logAndReturn = async (response, event, extra = {}) => {
    await logPaymentEvent({
      gateway: 'click',
      direction: 'inbound',
      event,
      requestIp: ip,
      requestHeaders: headers,
      requestBody: params,
      responseBody: response,
      durationMs: Date.now() - started,
      ...extra,
    })
    return response
  }

  if (!gateway.verifySignature(params)) {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.SIGN_CHECK_FAILED, params.merchant_trans_id),
      'sign_failed',
      { errorCode: '-1' }
    )
  }

  const order = await findOrder(params.merchant_trans_id)
  if (!order) {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.ORDER_NOT_FOUND, params.merchant_trans_id),
      'order_not_found'
    )
  }

  const expectedAmount = getOrderPayableAmount(order)
  if (!amountsMatch(expectedAmount, params.amount)) {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.INCORRECT_AMOUNT, params.merchant_trans_id),
      'amount_mismatch'
    )
  }

  if (order.status === 'cancelled') {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.ORDER_CANCELLED, params.merchant_trans_id),
      'order_cancelled'
    )
  }

  if (action === 0) {
    return handlePrepare(params, order, logAndReturn)
  }

  if (action === 1) {
    return handleComplete(params, order, logAndReturn)
  }

  return logAndReturn(
    gateway.errorResponse(CLICK_ERRORS.ACTION_NOT_FOUND, params.merchant_trans_id),
    'unknown_action'
  )
}

async function handlePrepare(params, order, logAndReturn) {
  if (order.paymentStatus === 'paid') {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.ALREADY_PAID, params.merchant_trans_id),
      'prepare_already_paid'
    )
  }

  let payment = await Payment.findOne({
    gateway: 'click',
    externalId: String(params.click_trans_id),
  })

  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      orderNumber: order.orderNumber,
      gateway: 'click',
      transactionId: String(params.click_trans_id),
      externalId: String(params.click_trans_id),
      amount: Number(params.amount),
      status: 'processing',
      clickAction: 0,
      metadata: { signTime: params.sign_time },
    })
  }

  return logAndReturn(
    gateway.successResponse(payment._id.toString(), params.merchant_trans_id),
    'prepare'
  )
}

async function handleComplete(params, order, logAndReturn) {
  const payment = await Payment.findOne({
    gateway: 'click',
    externalId: String(params.click_trans_id),
  })

  if (!payment) {
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.TRANSACTION_NOT_FOUND, params.merchant_trans_id),
      'complete_not_found'
    )
  }

  if (payment.status === 'paid') {
    return logAndReturn(
      gateway.successResponse(payment._id.toString(), params.merchant_trans_id),
      'complete_already_paid'
    )
  }

  if (Number(params.error) !== 0) {
    payment.status = 'failed'
    payment.failedAt = new Date()
    payment.lastError = params.error_note || 'Click payment failed'
    await payment.save()
    await cancelPendingOrder(order, { note: `Click error: ${payment.lastError}` })
    return logAndReturn(
      gateway.errorResponse(CLICK_ERRORS.FAILED_UPDATE, params.merchant_trans_id),
      'complete_failed'
    )
  }

  payment.status = 'paid'
  payment.clickAction = 1
  payment.paidAt = new Date()
  await payment.save()

  await fulfillOrderPayment(order, { note: 'Click complete callback' })

  return logAndReturn(
    gateway.successResponse(payment._id.toString(), params.merchant_trans_id),
    'complete'
  )
}
