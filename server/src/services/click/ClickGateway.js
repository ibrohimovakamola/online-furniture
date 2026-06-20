import crypto from 'crypto'
import { clickConfig } from '../../config/payments.js'

/** Click SHOP-API error codes */
export const CLICK_ERRORS = {
  SIGN_CHECK_FAILED: { error: -1, error_note: 'SIGN CHECK FAILED!' },
  INCORRECT_AMOUNT: { error: -2, error_note: 'Incorrect parameter amount' },
  ACTION_NOT_FOUND: { error: -3, error_note: 'Action not found' },
  ALREADY_PAID: { error: -4, error_note: 'Already paid' },
  ORDER_NOT_FOUND: { error: -5, error_note: 'Order not found' },
  TRANSACTION_NOT_FOUND: { error: -6, error_note: 'Transaction does not exist' },
  FAILED_UPDATE: { error: -7, error_note: 'Failed to update order' },
  ORDER_CANCELLED: { error: -9, error_note: 'Order cancelled' },
}

export class ClickGateway {
  constructor(config = clickConfig) {
    this.config = config
  }

  isConfigured() {
    return Boolean(this.config.serviceId && this.config.merchantUserId && this.config.secretKey)
  }

  /**
   * Generate Click payment redirect URL.
   * @alias generateClickCheckout
   */
  generatePaymentUrl({ orderId, amountUzs, returnUrl, description: _description }) {
    const url = new URL(this.config.prepareUrl)
    url.searchParams.set('service_id', this.config.serviceId)
    url.searchParams.set('merchant_id', this.config.merchantUserId)
    url.searchParams.set('amount', Number(amountUzs).toFixed(2))
    url.searchParams.set('transaction_param', String(orderId))
    url.searchParams.set('return_url', returnUrl || this.config.returnUrl)
    return url.toString()
  }

  /** MD5 signature for prepare/complete callbacks */
  verifySignature(params) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = params

    const expected = this.generateSignature({
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
    })

    return expected === sign_string
  }

  generateSignature({ click_trans_id, service_id, merchant_trans_id, amount, action, sign_time }) {
    const raw = [
      click_trans_id,
      service_id,
      this.config.secretKey,
      merchant_trans_id,
      amount,
      action,
      sign_time,
    ].join('')
    return crypto.createHash('md5').update(raw).digest('hex')
  }

  successResponse(merchantConfirmId, merchantTransId) {
    return {
      click_trans_id: merchantConfirmId,
      merchant_trans_id: merchantTransId,
      merchant_confirm_id: merchantConfirmId,
      error: 0,
      error_note: 'Success',
    }
  }

  errorResponse(errDef, merchantTransId = null) {
    return {
      error: errDef.error,
      error_note: errDef.error_note,
      merchant_trans_id: merchantTransId,
    }
  }

  /**
   * Optional live status check via Click merchant API.
   * Returns null when API is unreachable or not configured.
   */
  async fetchTransactionStatus(clickTransId) {
    if (!this.isConfigured() || !clickTransId) return null

    try {
      const url = new URL(this.config.statusApiUrl)
      url.searchParams.set('service_id', this.config.serviceId)
      url.searchParams.set('merchant_trans_id', String(clickTransId))

      const auth = Buffer.from(
        `${this.config.merchantUserId}:${this.config.secretKey}`
      ).toString('base64')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  }
}

export default ClickGateway

export function generateClickCheckout(orderId, amountUzs, description, options = {}) {
  const gw = new ClickGateway()
  return gw.generatePaymentUrl({
    orderId: String(orderId),
    amountUzs: Number(amountUzs),
    returnUrl: options.returnUrl,
    description,
  })
}
