/**
 * Payme & Click payment gateway configuration.
 * Copy values from merchant dashboards into server/.env
 */

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
const isProduction = process.env.NODE_ENV === 'production'

function parsePaymeTestMode() {
  const raw = process.env.PAYME_TEST_MODE
  if (raw === 'true') return true
  if (raw === 'false') return false
  return !isProduction
}

const paymeTestMode = parsePaymeTestMode()

export const PAYMENT_PROVIDERS = ['payme', 'click']

export const paymeConfig = {
  merchantId: process.env.PAYME_MERCHANT_ID || '',
  /** Merchant API key — PAYME_MERCHANT_KEY or legacy PAYME_KEY */
  key: process.env.PAYME_MERCHANT_KEY || process.env.PAYME_KEY || '',
  serviceId: process.env.PAYME_SERVICE_ID || '',
  testMode: paymeTestMode,
  checkoutBase:
    process.env.PAYME_CHECKOUT_URL ||
    (paymeTestMode ? 'https://checkout.test.paycom.uz' : 'https://checkout.paycom.uz'),
  returnUrl: process.env.PAYME_RETURN_URL || `${clientUrl}/payment/result`,
  webhookUrl: process.env.PAYME_WEBHOOK_URL || '',
  webhookUser: 'Paycom',
  /** Payme Merchant API allowed source IPs (optional whitelist) */
  allowedIps: (process.env.PAYME_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
}

export const clickConfig = {
  serviceId: process.env.CLICK_SERVICE_ID || '',
  merchantUserId: process.env.CLICK_MERCHANT_ID || '',
  secretKey: process.env.CLICK_SECRET_KEY || '',
  testMode: process.env.CLICK_TEST_MODE !== 'false',
  prepareUrl:
    process.env.CLICK_PREPARE_URL ||
    (process.env.CLICK_TEST_MODE !== 'false'
      ? 'https://my.click.uz/services/pay'
      : 'https://my.click.uz/services/pay'),
  returnUrl: process.env.CLICK_RETURN_URL || `${clientUrl}/payment/result`,
  statusApiUrl: process.env.CLICK_STATUS_URL || 'https://api.click.uz/v2/merchant/payment/status',
}

export function isPaymeConfigured() {
  return Boolean(paymeConfig.merchantId && paymeConfig.key)
}

/** Canonical webhook URL for Payme dashboard registration */
export function getPaymeWebhookUrl() {
  if (paymeConfig.webhookUrl) return paymeConfig.webhookUrl
  const base = clientUrl.replace(/\/$/, '')
  return `${base}/api/payments/payme-callback`
}

export function getPaymeStatus() {
  return {
    configured: isPaymeConfigured(),
    testMode: paymeConfig.testMode,
    merchantId: paymeConfig.merchantId ? '[set]' : '[missing]',
    serviceId: paymeConfig.serviceId ? '[set]' : '[missing]',
    webhookUrl: getPaymeWebhookUrl(),
    checkoutBase: paymeConfig.checkoutBase,
  }
}

export function isClickConfigured() {
  return Boolean(clickConfig.serviceId && clickConfig.merchantUserId && clickConfig.secretKey)
}

/** UZS → Payme tiyn (1 UZS = 100 tiyn) */
export function uzsToTiyn(amountUzs) {
  return Math.round(Number(amountUzs) * 100)
}

/** Payme tiyn → UZS */
export function tiynToUzs(tiyn) {
  return Number(tiyn) / 100
}
