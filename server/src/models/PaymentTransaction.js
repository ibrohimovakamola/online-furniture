import Payment from './Payment.js'
import { PAYME_STATES } from '../services/payme/PaymeGateway.js'

/**
 * Payme transaction state codes (stored on Payment.paymeState).
 * Records live in the `payments` collection via the Payment model.
 */
export const TRANSACTION_STATES = {
  PENDING: PAYME_STATES.CREATED,
  COMPLETED: PAYME_STATES.COMPLETED,
  CANCELLED: PAYME_STATES.CANCELLED_BEFORE,
}

/** Find a Payme transaction by Mongo _id or Payme transaction id */
export async function findPaymeTransaction(id) {
  if (!id) return null
  return Payment.findOne({
    gateway: 'payme',
    $or: [{ _id: id }, { transactionId: String(id) }],
  })
}

/** Map Payment document to a plain transaction object */
export function toTransactionDto(doc) {
  if (!doc) return null
  return {
    _id: doc._id,
    orderId: doc.order,
    amount: doc.amount,
    currency: doc.currency || 'UZS',
    state: doc.paymeState ?? TRANSACTION_STATES.PENDING,
    externalId: doc.transactionId || doc.externalId || '',
    createdAt: doc.createdAt,
    completedAt: doc.paidAt || null,
    status: doc.status,
  }
}

/** @alias Payment — gateway payment transactions (Payme, Click, …) */
export default Payment
