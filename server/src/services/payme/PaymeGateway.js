import crypto from 'crypto'
import { paymeConfig, uzsToTiyn } from '../../config/payments.js'

/** Payme Merchant API error codes */
export const PAYME_ERRORS = {
  INVALID_JSON: { code: -32700, message: { uz: 'JSON parsing xatosi', ru: 'Ошибка парсинга JSON', en: 'JSON parsing error' } },
  METHOD_NOT_FOUND: { code: -32601, message: { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' } },
  AUTH_ERROR: { code: -32504, message: { uz: 'Avtorizatsiya xatosi', ru: 'Ошибка авторизации', en: 'Authorization error' } },
  INVALID_AMOUNT: { code: -31001, message: { uz: 'Noto\'g\'ri summa', ru: 'Неверная сумма', en: 'Invalid amount' } },
  TRANSACTION_NOT_FOUND: { code: -31003, message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } },
  UNABLE_TO_PERFORM: { code: -31008, message: { uz: 'Amalni bajarib bo\'lmadi', ru: 'Невозможно выполнить', en: 'Unable to perform' } },
  ORDER_NOT_FOUND: { code: -31050, message: { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' } },
  ORDER_ALREADY_PAID: { code: -31051, message: { uz: 'Buyurtma allaqachon to\'langan', ru: 'Заказ уже оплачен', en: 'Order already paid' } },
  ORDER_CANCELLED: { code: -31052, message: { uz: 'Buyurtma bekor qilingan', ru: 'Заказ отменён', en: 'Order cancelled' } },
  ALREADY_DONE: { code: -31099, message: { uz: 'Allaqachon bajarilgan', ru: 'Уже выполнено', en: 'Already done' } },
}

export const PAYME_STATES = {
  CREATED: 1,
  COMPLETED: 2,
  CANCELLED_BEFORE: -1,
  CANCELLED_AFTER: -2,
}

export class PaymeGateway {
  constructor(config = paymeConfig) {
    this.config = config
  }

  isConfigured() {
    return Boolean(this.config.merchantId && this.config.key)
  }

  /** Verify incoming Basic auth from Payme (username Paycom, password = key) */
  verifyAuth(authorizationHeader) {
    if (!authorizationHeader?.startsWith('Basic ')) return false
    const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8')
    const [user, pass] = decoded.split(':')
    return user === this.config.webhookUser && pass === this.config.key
  }

  /** Optional IP whitelist */
  isAllowedIp(ip) {
    if (!this.config.allowedIps?.length) return true
    const normalized = String(ip || '').replace('::ffff:', '')
    return this.config.allowedIps.includes(normalized)
  }

  /**
   * Generate Payme checkout redirect URL.
   * @alias generatePaymeCheckout
   */
  generatePaymentUrl({ orderId, amountUzs, returnUrl, lang = 'uz', description: _description }) {
    const payload = {
      m: this.config.merchantId,
      ac: { order_id: String(orderId) },
      a: uzsToTiyn(amountUzs),
      c: returnUrl || this.config.returnUrl,
      l: lang,
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    return `${this.config.checkoutBase}/${encoded}`
  }

  /** SHA-256 signature for outbound API calls (if needed) */
  signPayload(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  }

  buildError(errDef, data = null, id = null) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: errDef.code, message: errDef.message, data },
    }
  }

  buildResult(result, id) {
    return { jsonrpc: '2.0', id, result }
  }

  validateTimestamp(createTime) {
    const ts = Number(createTime)
    if (!Number.isFinite(ts)) return false
    const now = Date.now()
    const maxAge = 86400000 // 24h
    return Math.abs(now - ts) <= maxAge
  }
}

export default PaymeGateway

/** Generate Payme checkout URL (orderId, amount UZS, description). */
export function generatePaymeCheckout(orderId, amountUzs, description, options = {}) {
  const gw = new PaymeGateway()
  return gw.generatePaymentUrl({
    orderId: String(orderId),
    amountUzs: Number(amountUzs),
    returnUrl: options.returnUrl,
    lang: options.lang || 'uz',
    description,
  })
}
