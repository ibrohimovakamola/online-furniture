import PaymentLog from '../models/PaymentLog.js'

/**
 * Persist payment audit log (fire-and-forget).
 */
export async function logPaymentEvent({
  payment = null,
  order = null,
  gateway = '',
  direction = 'inbound',
  event,
  status = '',
  requestIp = '',
  requestHeaders = {},
  requestBody = {},
  responseBody = {},
  errorCode = '',
  errorMessage = '',
  durationMs = 0,
}) {
  try {
    await PaymentLog.create({
      payment: payment?._id || payment || null,
      order: order?._id || order || null,
      gateway,
      direction,
      event,
      status,
      requestIp,
      requestHeaders: sanitizeHeaders(requestHeaders),
      requestBody: sanitizeBody(requestBody),
      responseBody: sanitizeBody(responseBody),
      errorCode,
      errorMessage,
      durationMs,
    })
  } catch (err) {
    console.error('[payment-log]', event, err.message)
  }
}

function sanitizeHeaders(headers) {
  const safe = { ...headers }
  if (safe.authorization) safe.authorization = '[redacted]'
  return safe
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  const clone = JSON.parse(JSON.stringify(body))
  for (const key of ['password', 'secret', 'secret_key', 'key']) {
    if (clone[key]) clone[key] = '[redacted]'
  }
  return clone
}
