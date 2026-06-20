import Order from '../models/Order.js'

import { AppError, asyncHandler } from '../utils/asyncHandler.js'

import { formatOrder } from '../utils/formatOrder.js'

import { buildOrderFromCart } from '../utils/buildOrderFromCart.js'
import { generateOrderNumber } from '../utils/orderNumber.js'

import PaymeGateway from '../services/payme/PaymeGateway.js'

import ClickGateway from '../services/click/ClickGateway.js'

import { isPaymeConfigured, isClickConfigured } from '../config/payments.js'
import { sendOrderConfirmationEmail } from '../utils/orderEmails.js'
import { logOrderCreated } from '../utils/activityLogger.js'



const payme = new PaymeGateway()

const click = new ClickGateway()



export const checkout = asyncHandler(async (req, res) => {
  const body = req.validated || req.body

  const {
    items,
    shippingAddress,
    paymentMethod = 'card',
    payment,
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

            : 'card'



  const isGateway = normalizedMethod === 'payme' || normalizedMethod === 'click'

  const isInstallment = normalizedMethod === 'installment'



  if (!isInstallment && !isGateway) {

    if (!payment?.cardNumber || !payment?.expiry || !payment?.cvv) {

      throw new AppError('Payment details are required', 400)

    }

    if (String(payment.cardNumber).replace(/\s/g, '').length < 13) {

      throw new AppError('Invalid card number', 400)

    }

  }



  if (normalizedMethod === 'payme' && !isPaymeConfigured()) {

    throw new AppError('Payme payment is not configured', 503)

  }

  if (normalizedMethod === 'click' && !isClickConfigured()) {

    throw new AppError('Click payment is not configured', 503)

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
  const gatewayReturnBase =
    returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/result`
  const gatewayReturnUrl = `${gatewayReturnBase}${gatewayReturnBase.includes('?') ? '&' : '?'}orderId=${order._id}&gateway=${normalizedMethod}`

  if (normalizedMethod === 'payme') {
    paymentUrl = payme.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: order.total,
      returnUrl: gatewayReturnUrl,
    })
  } else if (normalizedMethod === 'click') {
    paymentUrl = click.generatePaymentUrl({
      orderId: order._id.toString(),
      amountUzs: order.total,
      returnUrl: gatewayReturnUrl,
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

    gateway: isGateway ? normalizedMethod : null,

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

