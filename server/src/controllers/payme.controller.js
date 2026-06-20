import Order from '../models/Order.js'
import Payment from '../models/Payment.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import PaymeGateway, { PAYME_STATES } from '../services/payme/PaymeGateway.js'
import { handlePaymeRpc } from '../services/payme/paymeHandler.js'
import {
  isPaymeConfigured,
  uzsToTiyn,
  getPaymeWebhookUrl,
  paymeConfig,
} from '../config/payments.js'
import { getOrderPayableAmount, amountsMatch } from '../utils/orderAmount.js'

const payme = new PaymeGateway()

/**
 * POST /api/payment/payme/init
 * Order → Payme checkout redirect URL (also available at POST /api/payments/init).
 */
export const initPayme = asyncHandler(async (req, res) => {
  const { orderId, amount, returnUrl } = req.body

  if (!orderId) throw new AppError('orderId is required', 400)
  if (!isPaymeConfigured()) throw new AppError('Payme is not configured', 503)

  const order = await Order.findOne({ _id: orderId, customer: req.user._id })
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentStatus === 'paid') throw new AppError('Order is already paid', 400)
  if (order.status === 'cancelled') throw new AppError('Order is cancelled', 400)

  const payable = getOrderPayableAmount(order)
  const amountUzs = amount != null ? Number(amount) : payable
  if (!Number.isFinite(amountUzs) || amountUzs <= 0) {
    throw new AppError('Invalid amount', 400)
  }
  if (!amountsMatch(amountUzs, payable)) {
    throw new AppError('Amount does not match order total', 400)
  }

  const gatewayReturnBase =
    returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
  const gatewayReturnUrl = `${gatewayReturnBase}${gatewayReturnBase.includes('?') ? '&' : '?'}orderId=${order._id}&gateway=payme`

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

  const url = payme.generatePaymentUrl({
    orderId: order._id.toString(),
    amountUzs,
    returnUrl: gatewayReturnUrl,
  })

  res.json({
    success: true,
    jsonrpc: '2.0',
    result: { url },
    paymentUrl: url,
    orderId: order._id,
    amount: amountUzs,
    merchantId: paymeConfig.merchantId,
    webhookUrl: getPaymeWebhookUrl(),
  })
})

/** POST /api/payment/payme/webhook — Payme Merchant API JSON-RPC */
export const paymeWebhook = asyncHandler(async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || ''
  const response = await handlePaymeRpc(req.body, { ip, headers: req.headers })
  res.json(response)
})
