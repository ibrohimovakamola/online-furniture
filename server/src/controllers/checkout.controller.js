import Order from '../models/Order.js'

import { AppError, asyncHandler } from '../utils/asyncHandler.js'

import { formatOrder } from '../utils/formatOrder.js'

import { buildOrderFromCart } from '../utils/buildOrderFromCart.js'
import { generateOrderNumber } from '../utils/orderNumber.js'

import PaymeGateway from '../services/payme/PaymeGateway.js'
import ClickGateway from '../services/click/ClickGateway.js'
import { generateUzumCheckout } from '../services/payment/index.js'
import { isPaymeConfigured, isClickConfigured, isUzumBankConfigured } from '../config/payments.js'
import { sendOrderConfirmationEmail } from '../utils/orderEmails.js'
import { logOrderCreated } from '../utils/activityLogger.js'
import { startGatewayPayment } from './payment.controller.js'
import { amountsMatch } from '../utils/orderAmount.js'



const payme = new PaymeGateway()

const click = new ClickGateway()



export const checkout = asyncHandler(async (req, res) => {
  const body = req.validated || req.body

  const {
    items,
    shippingAddress,
    paymentMethod = 'payme',
    premiumServices,
    installmentPlan,
    returnUrl,
  } = body

  const normalizedMethod =
    paymentMethod === 'installment'
      ? 'installment'
      : paymentMethod === 'cash'
        ? 'cash'
        : paymentMethod === 'payme'
          ? 'payme'
          : paymentMethod === 'click'
            ? 'click'
            : paymentMethod === 'uzumbank'
              ? 'uzumbank'
              : paymentMethod

  if (normalizedMethod === 'card') {
    throw new AppError(
      'Direct card entry is not supported. Please use Payme, Click, or Uzum Bank.',
      400
    )
  }

  if (
    !['installment', 'cash', 'payme', 'click', 'uzumbank'].includes(normalizedMethod)
  ) {
    throw new AppError('Unsupported payment method', 400)
  }

  const installmentGateway = installmentPlan?.gateway
  const isGateway =
    normalizedMethod === 'payme' ||
    normalizedMethod === 'click' ||
    normalizedMethod === 'uzumbank' ||
    (normalizedMethod === 'installment' && Boolean(installmentGateway))
  const isInstallment = normalizedMethod === 'installment'
  const activeGateway =
    normalizedMethod === 'installment' ? installmentGateway : normalizedMethod

  if (activeGateway === 'payme' && !isPaymeConfigured()) {
    throw new AppError('Payme payment is not configured', 503)
  }
  if (activeGateway === 'click' && !isClickConfigured()) {
    throw new AppError('Click payment is not configured', 503)
  }
  if (activeGateway === 'uzumbank' && !isUzumBankConfigured()) {
    throw new AppError('Uzum Bank payment is not configured', 503)
  }



  const built = await buildOrderFromCart({

    items,

    premiumServices,

    paymentMethod: normalizedMethod,

    installmentPlan,

  })



  const order = await Order.create({

    orderNumber: await generateOrderNumber(),

    customer: req.user._id,

    items: built.orderItems,

    status: built.orderStatus,

    paymentStatus: built.paymentStatus === 'pending' ? 'unpaid' : built.paymentStatus,

    paymentMethod: normalizedMethod,

    shippingAddress: {

      ...shippingAddress,

      email: shippingAddress.email || req.user.email,

    },

    subtotal: built.subtotal,

    totalPrice: built.subtotal,

    discount_amount: 0,

    finalPrice: built.orderTotal,

    shippingCost: built.shippingCost,

    serviceFees: built.serviceFees,

    premiumServices: {

      deliveryToFloor: Boolean(premiumServices?.deliveryToFloor),

      professionalAssembly: Boolean(premiumServices?.professionalAssembly),

    },

    total: built.orderTotal,

    installmentDetails: built.installmentDetails,
    metadata: built.installmentGateway
      ? { installmentGateway: built.installmentGateway }
      : undefined,
    statusHistory: [{ status: built.orderStatus, changedBy: req.user._id, note: built.statusNote }],

  })



  // Gateway orders: stock deducted on webhook confirmation, not at checkout

  if (!built.isGateway) {

    for (const { product, quantity } of built.stockUpdates) {

      product.stock -= quantity

      await product.save()

    }

    order.metadata = { stockDeducted: true }

    await order.save()

  }



  await order.populate('customer', 'firstName lastName email')

  if (!built.isGateway) {
    sendOrderConfirmationEmail(order)
  }

  let paymentUrl = null
  const chargeAmount = built.gatewayChargeAmount ?? order.total
  const gatewayReturnBase =
    returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
  const gatewayReturnUrl = `${gatewayReturnBase}${gatewayReturnBase.includes('?') ? '&' : '?'}orderId=${order._id}&gateway=${activeGateway || normalizedMethod}`

  if (activeGateway === 'payme') {
    paymentUrl = payme.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: chargeAmount,
      returnUrl: gatewayReturnUrl,
    })
  } else if (activeGateway === 'click') {
    paymentUrl = click.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: chargeAmount,
      returnUrl: gatewayReturnUrl,
    })
  } else if (activeGateway === 'uzumbank') {
    paymentUrl = await generateUzumCheckout(order._id.toString(), chargeAmount, `Buyurtma ${order.orderNumber}`, {
      returnUrl: gatewayReturnUrl,
      orderNumber: order.orderNumber,
    })
  }

  const message = isGateway
    ? 'Order created. Redirect to payment gateway.'
    : isInstallment
      ? 'Installment order placed. First payment due on the scheduled date.'
      : 'Payment successful. Order placed.'



  logOrderCreated(order, req)

  res.status(201).json({

    success: true,

    message,

    order: formatOrder(order),

    paymentUrl,

    gateway: isGateway ? activeGateway || normalizedMethod : null,

  })

})



export const myOrders = asyncHandler(async (req, res) => {

  const orders = await Order.find({ customer: req.user._id })

    .populate('customer', 'firstName lastName email')

    .sort({ createdAt: -1 })



  res.json({ success: true, orders: orders.map(formatOrder) })

})



export const getMyOrder = asyncHandler(async (req, res) => {

  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate(

    'customer',

    'firstName lastName email'

  )



  if (!order) throw new AppError('Order not found', 404)



  res.json({ success: true, order: formatOrder(order) })

})



export { formatOrder }

/**
 * POST /api/orders/create-payment
 * Start gateway checkout for an installment (or unpaid) order.
 */
export const createOrderPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, amount, installmentPeriod, returnUrl } = req.validated || req.body

  const order = await Order.findOne({ _id: orderId, customer: req.user._id })
  if (!order) throw new AppError('Order not found', 404)

  if (order.paymentMethod === 'installment') {
    if (!order.installmentDetails) {
      throw new AppError('Order has no installment plan', 400)
    }
    const { planMonths, monthlyPayment } = order.installmentDetails
    if (installmentPeriod && Number(installmentPeriod) !== planMonths) {
      throw new AppError('Installment period does not match order', 400)
    }
    if (!amountsMatch(monthlyPayment, amount)) {
      throw new AppError('Amount does not match installment monthly payment', 400)
    }
  } else if (amount != null) {
    const expected = order.total ?? order.finalPrice
    if (!amountsMatch(expected, amount)) {
      throw new AppError('Amount does not match order total', 400)
    }
  }

  const data = await startGatewayPayment(order, paymentMethod, { returnUrl, req })

  res.json({
    success: true,
    data: {
      ...data,
      installmentPeriod: order.installmentDetails?.planMonths ?? installmentPeriod ?? null,
    },
  })
})

