import Order from '../models/Order.js'
import Payment from '../models/Payment.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import {
  generatePaymeCheckout,
  generateClickCheckout,
  generateUzumCheckout,
  verifyPaymeCallback,
  verifyClickCallback,
  verifyUzumCallback,
  getPaymeTransactionStatus,
  getClickTransactionStatus,
  getUzumTransactionStatus,
  paymeGateway,
  clickGateway,
  uzumGateway,
} from '../services/payment/index.js'
import { isPaymeConfigured, isClickConfigured, isUzumBankConfigured, uzsToTiyn } from '../config/payments.js'
import { logActivity } from '../utils/activityLogger.js'
import { getOrderPayableAmount } from '../utils/orderAmount.js'
import { PAYME_STATES } from '../services/payme/PaymeGateway.js'

function buildReturnUrl(orderId, gateway, returnUrl) {
  const base = returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
  return `${base}${base.includes('?') ? '&' : '?'}orderId=${orderId}&gateway=${gateway}`
}

function formatPaymentRecord(payment) {
  if (!payment) return null
  return {
    id: String(payment._id),
    paymentId: String(payment._id),
    gateway: payment.gateway,
    status: payment.status,
    transactionId: payment.transactionId,
    amount: payment.amount,
    paidAt: payment.paidAt,
  }
}

/**
 * Start gateway checkout for an existing order (shared by initiate + create-payment).
 */
export async function startGatewayPayment(order, paymentMethod, { returnUrl, req } = {}) {
  if (!paymentMethod) throw new AppError('paymentMethod is required', 400)
  if (order.paymentStatus === 'paid') throw new AppError('Order is already paid', 400)
  if (order.status === 'cancelled') throw new AppError('Order is cancelled', 400)

  const amountUzs = getOrderPayableAmount(order, { forGateway: true })
  if (amountUzs <= 0) throw new AppError('Invalid order amount', 400)

  const description = `Buyurtma ${order.orderNumber}`
  const gatewayReturnUrl = buildReturnUrl(order._id, paymentMethod, returnUrl)

  let paymentUrl = null

  if (paymentMethod === 'payme') {
    if (!isPaymeConfigured()) throw new AppError('Payme is not configured', 503)

    await Payment.findOneAndUpdate(
      {
        order: order._id,
        gateway: 'payme',
        status: { $in: ['pending', 'processing'] },
        transactionId: { $in: ['', null] },
      },
      {
        order: order._id,
        orderNumber: order.orderNumber,
        gateway: 'payme',
        amount: amountUzs,
        amountTiyn: uzsToTiyn(amountUzs),
        currency: 'UZS',
        status: 'pending',
        paymeState: PAYME_STATES.CREATED,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    paymentUrl = generatePaymeCheckout(order._id.toString(), amountUzs, description, {
      returnUrl: gatewayReturnUrl,
    })
  } else if (paymentMethod === 'click') {
    if (!isClickConfigured()) throw new AppError('Click is not configured', 503)

    await Payment.findOneAndUpdate(
      {
        order: order._id,
        gateway: 'click',
        status: { $in: ['pending', 'processing'] },
      },
      {
        order: order._id,
        orderNumber: order.orderNumber,
        gateway: 'click',
        amount: amountUzs,
        currency: 'UZS',
        status: 'pending',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    paymentUrl = generateClickCheckout(order._id.toString(), amountUzs, description, {
      returnUrl: gatewayReturnUrl,
    })
  } else if (paymentMethod === 'uzumbank') {
    if (!isUzumBankConfigured()) throw new AppError('Uzum Bank is not configured', 503)

    paymentUrl = await generateUzumCheckout(order._id.toString(), amountUzs, description, {
      returnUrl: gatewayReturnUrl,
      orderNumber: order.orderNumber,
    })
  } else {
    throw new AppError('Unsupported payment method', 400)
  }

  if (order.paymentMethod === 'installment') {
    order.metadata = {
      ...(order.metadata || {}),
      installmentGateway: paymentMethod,
    }
  } else {
    order.paymentMethod = paymentMethod
  }
  await order.save()

  if (req) {
    logActivity(
      {
        type: 'purchase',
        action: 'payment_initiated',
        orderId: order._id,
        details: { paymentMethod, amount: amountUzs, orderNumber: order.orderNumber },
      },
      req
    )
  }

  return {
    paymentUrl,
    checkoutUrl: paymentUrl,
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    amount: amountUzs,
    paymentMethod,
  }
}

/**
 * POST /api/payments/initiate
 * Start Payme or Click checkout for an existing unpaid order.
 */
export const initiatePayment = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const paymentMethod = body.paymentMethod || body.gateway
  const { orderId, returnUrl } = body

  const order = await Order.findOne({ _id: orderId, customer: req.user._id })
  if (!order) throw new AppError('Order not found', 404)

  const data = await startGatewayPayment(order, paymentMethod, { returnUrl, req })

  res.json({
    success: true,
    data,
  })
})

/**
 * POST /api/payments/payme-callback
 * Payme Merchant API JSON-RPC webhook (signature via Basic auth).
 */
export const handlePaymeWebhook = asyncHandler(async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || ''
  const rpcResponse = await verifyPaymeCallback(req, { ip, headers: req.headers })

  res.json(rpcResponse)

  if (rpcResponse?.result && !rpcResponse.error) {
    const txId = rpcResponse.result?.transaction || req.body?.params?.id
    if (txId) {
      const status = await getPaymeTransactionStatus(txId)
      if (status.isCompleted) {
        /* Payme requires JSON-RPC body — success metadata is in Payment record */
      }
    }
  }
})

/**
 * POST /api/payments/click-callback
 * Click prepare/complete webhook (MD5 sign_string verification).
 */
export const handleClickWebhook = asyncHandler(async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || ''
  const clickResponse = await verifyClickCallback(req, { ip, headers: req.headers })

  if (Number(clickResponse?.error) === 0) {
    const payment = await Payment.findOne({
      gateway: 'click',
      externalId: String(req.body?.click_trans_id || req.query?.click_trans_id || ''),
    })

    if (payment) {
      return res.json({
        ...clickResponse,
        success: true,
        paymentId: String(payment._id),
        orderNumber: payment.orderNumber,
      })
    }
  }

  res.json(clickResponse)
})

/**
 * POST /api/payment/uzumbank/callback
 * Uzum Bank Merchant API webhook (check/create/confirm/reverse/status).
 */
export const handleUzumWebhook = asyncHandler(async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || ''
  const response = await verifyUzumCallback(req, { ip, headers: req.headers })
  res.json(response)
})

/** GET /api/payments/:orderId/status */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    customer: req.user._id,
  })

  if (!order) throw new AppError('Order not found', 404)

  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 })

  let gatewayStatus = null
  if (payment?.gateway === 'payme' && payment.transactionId) {
    gatewayStatus = await getPaymeTransactionStatus(payment.transactionId)
  } else if (payment?.gateway === 'click' && payment.transactionId) {
    gatewayStatus = await getClickTransactionStatus(payment.transactionId)
  } else if (payment?.gateway === 'uzumbank' && (payment.transactionId || payment.externalId)) {
    gatewayStatus = await getUzumTransactionStatus(payment.transactionId || payment.externalId)
  }

  res.json({
    success: true,
    data: {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus:
        order.paymentStatus === 'pending' || order.paymentStatus === 'awaiting'
          ? 'unpaid'
          : order.paymentStatus,
      paymentMethod: order.paymentMethod,
      amount: getOrderPayableAmount(order),
      payment: formatPaymentRecord(payment),
      gatewayStatus,
    },
  })
})

/** Legacy aliases */
export const paymeWebhook = handlePaymeWebhook
export const clickCallback = handleClickWebhook
export const initGatewayPayment = initiatePayment

export const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId).populate('order')
  if (!payment) throw new AppError('Payment not found', 404)

  if (payment.gateway === 'payme' && payment.paymeState === PAYME_STATES.COMPLETED) {
    payment.paymeState = PAYME_STATES.CANCELLED_AFTER
    payment.status = 'refunded'
    payment.refundAmount = payment.amount
    payment.refundedAt = new Date()
    await payment.save()

    if (payment.order) {
      payment.order.paymentStatus = 'refunded'
      payment.order.statusHistory.push({
        status: payment.order.status,
        changedBy: req.user._id,
        note: 'Payme refund processed',
      })
      await payment.order.save()
    }

    return res.json({ success: true, message: 'Refund recorded', payment })
  }

  if (payment.status === 'paid') {
    payment.status = 'refunded'
    payment.refundAmount = payment.amount
    payment.refundedAt = new Date()
    await payment.save()
    return res.json({ success: true, message: 'Refund recorded', payment })
  }

  throw new AppError('Payment cannot be refunded in current state', 400)
})

export const listPaymentLogs = asyncHandler(async (req, res) => {
  const PaymentLog = (await import('../models/PaymentLog.js')).default
  const logs = await PaymentLog.find()
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 50)
    .lean()
  res.json({ success: true, logs })
})

export const listGateways = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      gateways: {
        payme: {
          enabled: isPaymeConfigured(),
          testMode: paymeGateway.config.testMode,
          checkoutBase: paymeGateway.config.checkoutBase,
        },
        click: {
          enabled: isClickConfigured(),
          testMode: clickGateway.config.testMode,
        },
        uzumbank: {
          enabled: isUzumBankConfigured(),
          testMode: uzumGateway.config.testMode,
        },
      },
      payme: {
        enabled: isPaymeConfigured(),
        testMode: paymeGateway.config.testMode,
        checkoutBase: paymeGateway.config.checkoutBase,
      },
      click: {
        enabled: isClickConfigured(),
        testMode: clickGateway.config.testMode,
      },
      uzumbank: {
        enabled: isUzumBankConfigured(),
        testMode: uzumGateway.config.testMode,
      },
    },
  })
})

export {
  generatePaymeCheckout,
  generateClickCheckout,
  generateUzumCheckout,
  verifyPaymeCallback,
  verifyClickCallback,
  verifyUzumCallback,
  getPaymeTransactionStatus,
  getClickTransactionStatus,
  getUzumTransactionStatus,
}
