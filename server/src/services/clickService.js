/**
 * Click payment service — facade over ClickGateway + clickHandler.
 */
export { ClickGateway, CLICK_ERRORS, generateClickCheckout } from './click/ClickGateway.js'
export { handleClickCallback } from './click/clickHandler.js'
export {
  generateClickCheckout as createClickPayment,
  verifyClickCallback,
  getClickTransactionStatus,
} from '../payment/index.js'
