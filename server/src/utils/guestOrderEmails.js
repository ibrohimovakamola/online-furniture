import { sendOrderConfirmationEmail } from './orderEmails.js'

/**
 * @param {{ order: import('../models/Order.js').default, trackingLink: string }} params
 */
export function sendGuestOrderConfirmation({ order, trackingLink }) {
  sendOrderConfirmationEmail(order, { trackingLink })
}
