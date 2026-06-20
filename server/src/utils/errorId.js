import crypto from 'crypto'

/** Support-ticket reference: ERR-A1B2C3 */
export function generateErrorId() {
  return `ERR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}
