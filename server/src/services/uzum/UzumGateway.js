import crypto from 'crypto'
import { uzumBankConfig } from '../../config/payments.js'

/** Uzum Merchant API error codes */
export const UZUM_ERRORS = {
  AUTH_ERROR: { code: -32504, message: 'Authorization error' },
  ORDER_NOT_FOUND: { code: -31050, message: 'Order not found' },
  INVALID_AMOUNT: { code: -31001, message: 'Invalid amount' },
  ALREADY_PAID: { code: -31051, message: 'Order already paid' },
  ORDER_CANCELLED: { code: -31052, message: 'Order cancelled' },
  TRANSACTION_NOT_FOUND: { code: -31003, message: 'Transaction not found' },
  UNABLE_TO_PERFORM: { code: -31008, message: 'Unable to perform operation' },
}

export const UZUM_STATES = {
  CREATED: 1,
  COMPLETED: 2,
  CANCELLED: -1,
}

export class UzumGateway {
  constructor(config = uzumBankConfig) {
    this.config = config
  }

  isConfigured() {
    return Boolean(this.config.merchantId && this.config.secretKey)
  }

  /** Basic auth: merchantId:secretKey */
  verifyAuth(authorizationHeader) {
    if (!authorizationHeader?.startsWith('Basic ')) return false
    const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8')
    const [user, pass] = decoded.split(':')
    return user === this.config.merchantId && pass === this.config.secretKey
  }

  /** HMAC-SHA256 signature for outbound API requests */
  signRequest(payload) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    return crypto.createHmac('sha256', this.config.secretKey).update(body).digest('hex')
  }

  verifyCallbackSignature(payload, signature) {
    if (!signature) return false
    const expected = this.signRequest(payload)
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    } catch {
      return expected === signature
    }
  }

  buildError(errDef, data = null) {
    return { success: false, error: { code: errDef.code, message: errDef.message, data } }
  }

  buildSuccess(result) {
    return { success: true, ...result }
  }

  /**
   * Create payment session via Uzum Merchant API and return checkout redirect URL.
   * Falls back to deep-link style URL when API is unreachable (dev/sandbox).
   */
  async createPaymentSession({ orderId, amountUzs, returnUrl, description }) {
    const payload = {
      merchant_id: this.config.merchantId,
      order_id: String(orderId),
      amount: Math.round(Number(amountUzs) * 100),
      currency: 'UZS',
      description: description || `Order ${orderId}`,
      return_url: returnUrl || this.config.returnUrl,
      callback_url: this.config.webhookUrl,
    }

    if (!this.isConfigured()) {
      throw new Error('Uzum Bank is not configured')
    }

    const apiUrl = `${this.config.apiUrl.replace(/\/$/, '')}/payment/create`
    const signature = this.signRequest(payload)

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.config.merchantId}:${this.config.secretKey}`).toString('base64')}`,
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(Number(process.env.PAYMENT_API_TIMEOUT_MS) || 15000),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Uzum API ${res.status}: ${errText || res.statusText}`)
      }

      const data = await res.json()
      const paymentUrl = data.payment_url || data.paymentUrl || data.checkout_url
      if (!paymentUrl) throw new Error('Uzum API did not return payment URL')

      return {
        paymentUrl,
        transactionId: data.transaction_id || data.transactionId || '',
        externalId: data.payment_id || data.paymentId || '',
      }
    } catch (err) {
      if (this.config.testMode) {
        const fallback = new URL(this.config.checkoutBase)
        fallback.searchParams.set('order_id', String(orderId))
        fallback.searchParams.set('amount', String(amountUzs))
        fallback.searchParams.set('return_url', payload.return_url)
        return { paymentUrl: fallback.toString(), transactionId: '', externalId: '' }
      }
      throw err
    }
  }

  /** Generate redirect URL without API call (test / fallback) */
  generatePaymentUrl({ orderId, amountUzs, returnUrl }) {
    const url = new URL(this.config.checkoutBase)
    url.searchParams.set('merchant_id', this.config.merchantId)
    url.searchParams.set('order_id', String(orderId))
    url.searchParams.set('amount', String(Math.round(Number(amountUzs))))
    url.searchParams.set('return_url', returnUrl || this.config.returnUrl)
    return url.toString()
  }
}

export default UzumGateway
