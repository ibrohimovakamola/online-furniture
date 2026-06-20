import { queueEmail } from '../utils/emailService.js'
import { getOrderPayableAmount } from '../utils/orderAmount.js'
import {
  buildContactFormReplyHtml,
  buildOrderConfirmationHtml,
  buildOrderDeliveredHtml,
  buildOrderShippedHtml,
  buildPasswordResetHtml,
  buildPaymentReceiptHtml,
  buildWelcomeHtml,
  getEmailSubject,
  normalizeLang,
} from '../utils/emailTemplates.js'

function formatUzs(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ')
}

function getClientBase() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function resolveOrderEmail(order) {
  return order?.guest?.email || order?.shippingAddress?.email || order?.customer?.email || null
}

function resolveCustomerName(order) {
  return (
    order?.guest?.name ||
    order?.shippingAddress?.fullName ||
    [order?.customer?.firstName, order?.customer?.lastName].filter(Boolean).join(' ') ||
    order?.customer?.firstName ||
    ''
  )
}

function resolveOrderLang(order, fallback = 'uz') {
  return normalizeLang(order?.metadata?.lang || order?.metadata?.locale || fallback)
}

function buildItemsHtml(items = [], lang = 'uz') {
  const l = normalizeLang(lang)
  return items
    .map((item) => {
      const name =
        (l === 'ru' && item.productName_ru) ||
        (l === 'en' && item.productName_en) ||
        item.productName_uz ||
        item.name
      return `<li>${name} × ${item.quantity} — ${formatUzs(item.lineTotal ?? item.subtotal)} so'm</li>`
    })
    .join('')
}

function getTrackingLink(order) {
  if (!order || order.isGuest) return null
  return `${getClientBase()}/orders/${order._id}`
}

function formatPaymentMethod(method) {
  const labels = {
    payme: 'Payme',
    click: 'Click',
    cash: 'Naqd pul / Cash',
    card: 'Bank kartasi',
    installment: 'Muddatli to\'lov',
    bank_transfer: 'Bank o\'tkazmasi',
    online: 'Onlayn',
  }
  return labels[method] || method || ''
}

function formatDate(date, lang = 'uz') {
  if (!date) return ''
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'uz-UZ'
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function queueHtmlEmail({ to, subject, html }) {
  if (!to) return
  queueEmail({ to, subject, html })
}

/**
 * Send order confirmation after successful payment or non-gateway checkout.
 * @param {import('../models/Order.js').default} order
 * @param {{ lang?: string, trackingLink?: string }} [options]
 */
export async function sendOrderConfirmation(order, options = {}) {
  try {
    const email = resolveOrderEmail(order)
    if (!email) return

    const lang = normalizeLang(options.lang || resolveOrderLang(order))
    const total = formatUzs(getOrderPayableAmount(order))
    const html = buildOrderConfirmationHtml({
      customerName: resolveCustomerName(order),
      orderNumber: order.orderNumber,
      itemsHtml: buildItemsHtml(order.items, lang),
      totalFormatted: total,
      trackingLink: options.trackingLink || getTrackingLink(order),
      lang,
    })

    queueHtmlEmail({
      to: email,
      subject: getEmailSubject('order-confirmation', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendOrderConfirmation failed:', err.message)
  }
}

/**
 * Notify customer when order status changes to shipped or delivered.
 * @param {import('../models/Order.js').default} order
 * @param {string} newStatus
 * @param {{ lang?: string }} [options]
 */
export async function sendOrderStatusUpdate(order, newStatus, options = {}) {
  try {
    const email = resolveOrderEmail(order)
    if (!email) return

    const status = String(newStatus || '').toLowerCase()
    if (!['shipped', 'delivered'].includes(status)) return

    const lang = normalizeLang(options.lang || resolveOrderLang(order))
    const customerName = resolveCustomerName(order)
    const trackingLink = getTrackingLink(order)
    const total = formatUzs(getOrderPayableAmount(order))

    if (status === 'shipped') {
      const eta = order.estimatedDeliveryDate
        ? formatDate(order.estimatedDeliveryDate, lang)
        : null
      const html = buildOrderShippedHtml({
        customerName,
        orderNumber: order.orderNumber,
        totalFormatted: total,
        trackingLink,
        estimatedDelivery: eta,
        lang,
      })
      queueHtmlEmail({
        to: email,
        subject: getEmailSubject('order-shipped', lang),
        html,
      })
      return
    }

    const html = buildOrderDeliveredHtml({
      customerName,
      orderNumber: order.orderNumber,
      lang,
    })
    queueHtmlEmail({
      to: email,
      subject: getEmailSubject('order-delivered', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendOrderStatusUpdate failed:', err.message)
  }
}

/**
 * Send payment receipt after successful payment.
 * @param {import('../models/Order.js').default} order
 * @param {{ lang?: string, paidAt?: Date }} [options]
 */
export async function sendPaymentReceipt(order, options = {}) {
  try {
    const email = resolveOrderEmail(order)
    if (!email) return

    const lang = normalizeLang(options.lang || resolveOrderLang(order))
    const html = buildPaymentReceiptHtml({
      customerName: resolveCustomerName(order),
      orderNumber: order.orderNumber,
      totalFormatted: formatUzs(getOrderPayableAmount(order)),
      paymentMethod: formatPaymentMethod(order.paymentMethod),
      paidAt: formatDate(options.paidAt || new Date(), lang),
      trackingLink: getTrackingLink(order),
      lang,
    })

    queueHtmlEmail({
      to: email,
      subject: getEmailSubject('payment-receipt', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendPaymentReceipt failed:', err.message)
  }
}

/**
 * Welcome email on customer signup.
 * @param {import('../models/User.js').default | { email: string, firstName?: string, lastName?: string }} user
 * @param {{ lang?: string }} [options]
 */
export async function sendWelcomeEmail(user, options = {}) {
  try {
    if (!user?.email) return

    const lang = normalizeLang(options.lang)
    const customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName || ''
    const html = buildWelcomeHtml({
      customerName,
      loginUrl: `${getClientBase()}/login`,
      lang,
    })

    queueHtmlEmail({
      to: user.email,
      subject: getEmailSubject('welcome', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendWelcomeEmail failed:', err.message)
  }
}

/**
 * Auto-reply when contact form is submitted.
 * @param {string} email
 * @param {string} message
 * @param {{ name?: string, lang?: string }} [options]
 */
export async function sendContactFormReply(email, message, options = {}) {
  try {
    if (!email) return

    const lang = normalizeLang(options.lang)
    const html = buildContactFormReplyHtml({
      customerName: options.name || '',
      message,
      lang,
    })

    queueHtmlEmail({
      to: email,
      subject: getEmailSubject('contact-reply', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendContactFormReply failed:', err.message)
  }
}

/**
 * Password reset link email.
 * @param {string} email
 * @param {string} resetLink
 * @param {{ lang?: string }} [options]
 */
export async function sendPasswordResetEmail(email, resetLink, options = {}) {
  try {
    if (!email || !resetLink) return

    const lang = normalizeLang(options.lang)
    const html = buildPasswordResetHtml({ resetLink, lang })

    queueHtmlEmail({
      to: email,
      subject: getEmailSubject('password-reset', lang),
      html,
    })
  } catch (err) {
    console.error('[emailController] sendPasswordResetEmail failed:', err.message)
  }
}

/** @deprecated use sendPaymentReceipt — kept for existing imports */
export function sendPaymentSuccessEmail(order) {
  sendPaymentReceipt(order)
}

/** @deprecated alias — kept for existing imports */
export function sendOrderConfirmationEmail(order, options = {}) {
  sendOrderConfirmation(order, options)
}
