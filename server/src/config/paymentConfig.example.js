/**
 * Payment gateway configuration reference.
 * Prefer environment variables in server/.env (see server/.env.example).
 */

export const paymentConfigExample = {
  payme: {
    merchantId: 'MERCHANT_ID',
    key: 'MERCHANT_KEY',
    testMode: true,
    checkoutUrl: 'https://checkout.test.paycom.uz',
    returnUrl: 'http://localhost:5173/payment/result',
    webhookPath: '/api/payments/payme/webhook',
    allowedIps: [],
  },
  click: {
    serviceId: 'SERVICE_ID',
    merchantUserId: 'MERCHANT_USER_ID',
    secretKey: 'SECRET_KEY',
    testMode: true,
    payUrl: 'https://my.click.uz/services/pay',
    returnUrl: 'http://localhost:5173/payment/result',
    callbackPath: '/api/payments/click/callback',
  },
}
