import Product from '../models/Product.js'
import Cart from '../models/Cart.js'
import { AppError, Errors } from './AppError.js'
import { getOrCreateSettings, calculateShippingCost } from './settingsHelper.js'
import { calculatePremiumServiceFees } from '../config/premiumServices.js'
import {
  calculateInstallmentPlan,
  getInitialNextPaymentDate,
  isValidPlanMonths,
} from '../config/installmentPlans.js'

function resolveUnitPrice(product) {
  return product.discountedPrice ?? product.price ?? product.basePrice ?? 0
}

function resolveBasePrice(product) {
  return product.basePrice ?? product.price ?? 0
}

function buildOrderItemFromProduct(product, quantity, color = '') {
  const unitPrice = resolveUnitPrice(product)
  const lineTotal = unitPrice * quantity

  return {
    product: product._id,
    productId: product._id,
    name: product.name_uz || product.name,
    productName_uz: product.name_uz || product.name || '',
    productName_ru: product.name_ru || '',
    productName_en: product.name_en || '',
    quantity,
    unitPrice,
    price: unitPrice,
    lineTotal,
    subtotal: lineTotal,
    color,
  }
}

/**
 * Build order payload from authenticated user's MongoDB cart.
 */
export async function buildOrderFromUserCart(userId, { discount_amount = 0, premiumServices } = {}) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice discount_percent stock isPublished isActive',
  })

  if (!cart?.items?.length) {
    throw new AppError('Cart is empty', 400)
  }

  const orderItems = []
  let totalPrice = 0
  let productDiscountTotal = 0
  const stockUpdates = []

  for (const line of cart.items) {
    const product = line.product
    if (!product || product.isPublished === false || product.isActive === false) {
      throw new AppError(`Product not available: ${line.product}`, 400)
    }

    const quantity = line.quantity
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new AppError('Invalid cart item quantity', 400)
    }
    if (product.stock < quantity) {
      throw Errors.insufficientStock(`Insufficient stock for ${product.name_uz || product.name}`)
    }

    const unitPrice = line.price_at_purchase ?? resolveUnitPrice(product)
    const basePrice = resolveBasePrice(product)
    const lineTotal = unitPrice * quantity
    totalPrice += lineTotal
    productDiscountTotal += Math.max(0, basePrice - unitPrice) * quantity

    orderItems.push({
      ...buildOrderItemFromProduct(product, quantity, line.color || ''),
      unitPrice,
      price: unitPrice,
      lineTotal,
      subtotal: lineTotal,
    })

    stockUpdates.push({ product, quantity })
  }

  const siteSettings = await getOrCreateSettings()
  const shippingCost = calculateShippingCost(totalPrice, siteSettings.shipping)
  const { total: serviceFees } = calculatePremiumServiceFees(premiumServices || {})
  const extraDiscount = Math.max(0, Number(discount_amount) || 0)
  const discount_amount_total = productDiscountTotal + extraDiscount
  const finalPrice = Math.max(0, totalPrice + shippingCost + serviceFees - extraDiscount)

  return {
    orderItems,
    stockUpdates,
    subtotal: totalPrice,
    totalPrice,
    discount_amount: discount_amount_total,
    finalPrice,
    shippingCost,
    serviceFees,
    orderTotal: finalPrice,
  }
}

/**
 * Validate cart items and compute order totals (shared by checkout + gateway flows).
 */
export async function buildOrderFromCart({
  items,
  premiumServices,
  paymentMethod = 'card',
  installmentPlan,
}) {
  if (!items?.length) throw new AppError('Cart is empty', 400)

  const isInstallment = paymentMethod === 'installment'
  const isGateway = paymentMethod === 'payme' || paymentMethod === 'click'

  if (isInstallment) {
    const planMonths = Number(installmentPlan?.planMonths)
    if (!isValidPlanMonths(planMonths)) {
      throw new AppError('Select a valid installment plan (3, 6, or 12 months)', 400)
    }
  }

  const orderItems = []
  let subtotal = 0
  const stockUpdates = []

  for (const item of items) {
    const product = await Product.findById(item.productId || item.id)
    if (!product || !product.isPublished) {
      throw new AppError(`Product not available: ${item.name || item.productId}`, 400)
    }
    if (product.stock < item.quantity) {
      throw Errors.insufficientStock(`Insufficient stock for ${product.name}`)
    }

    const unitPrice = product.discountedPrice ?? product.basePrice
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal

    orderItems.push({
      ...buildOrderItemFromProduct(product, item.quantity, item.color || ''),
      unitPrice,
      price: unitPrice,
      lineTotal,
      subtotal: lineTotal,
    })

    stockUpdates.push({ product, quantity: item.quantity })
  }

  const siteSettings = await getOrCreateSettings()
  const shippingCost = calculateShippingCost(subtotal, siteSettings.shipping)
  const { total: serviceFees } = calculatePremiumServiceFees(premiumServices || {})
  const baseTotal = subtotal + shippingCost + serviceFees

  let installmentDetails = null
  let orderTotal = baseTotal
  let paymentStatus = isGateway ? 'pending' : 'paid'
  let orderStatus = isGateway ? 'pending' : 'processing'
  let statusNote = isGateway
    ? `Awaiting ${paymentMethod} payment`
    : isInstallment
      ? `Installment order — ${installmentPlan.planMonths} months`
      : 'Order placed via checkout'

  if (isInstallment) {
    const planMonths = Number(installmentPlan.planMonths)
    const plan = calculateInstallmentPlan(baseTotal, planMonths)

    if (
      installmentPlan.totalAmountWithInterest != null &&
      Math.abs(Number(installmentPlan.totalAmountWithInterest) - plan.totalAmountWithInterest) > 1
    ) {
      throw new AppError('Installment totals have changed. Please refresh and try again.', 400)
    }

    orderTotal = plan.totalAmountWithInterest
    paymentStatus = 'pending'
    orderStatus = 'pending'
    statusNote = `Installment order — ${planMonths} months`

    installmentDetails = {
      planMonths: plan.planMonths,
      monthlyPayment: plan.monthlyPayment,
      totalAmountWithInterest: plan.totalAmountWithInterest,
      remainingBalance: plan.totalAmountWithInterest,
      paidMonths: 0,
      nextPaymentDate: getInitialNextPaymentDate(),
      markupPercent: plan.markupPercent,
      markupAmount: plan.markupAmount,
    }
  }

  return {
    orderItems,
    stockUpdates,
    subtotal,
    shippingCost,
    serviceFees,
    orderTotal,
    paymentStatus,
    orderStatus,
    statusNote,
    installmentDetails,
    isGateway,
    isInstallment,
  }
}
