# Payme & Click — Payment Integration Testing Guide

Stack: **React + Express + MongoDB** (`server/src/services/payme`, `server/src/services/click`).

PHP reference classes: `php-app/src/gateways/PaymeGateway.php`, `ClickGateway.php`.

---

## 1. Environment setup

Copy `server/.env.example` → `server/.env` and set:

```env
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_merchant_api_key
PAYME_SERVICE_ID=your_service_id
PAYME_WEBHOOK_URL=https://mebelsotish.uz/api/payment/payme/webhook
PAYME_TEST_MODE=true
PAYME_RETURN_URL=http://localhost:5173/payment/result

CLICK_SERVICE_ID=your_service_id
CLICK_MERCHANT_ID=your_merchant_user_id
CLICK_SECRET_KEY=your_secret_key
CLICK_TEST_MODE=true
CLICK_RETURN_URL=http://localhost:5173/payment/result
```

**Merchant dashboard URLs to register:**

| Gateway | Webhook / Callback URL |
|---------|------------------------|
| Payme   | `https://your-domain.com/api/payment/payme/webhook` |
| Click   | `https://your-domain.com/api/payments/click/callback` |

Local dev: use [ngrok](https://ngrok.com) or similar to expose port 5000.

---

## 2. Test card (Payme sandbox)

| Field | Value |
|-------|-------|
| Card  | `9860 0000 0000 0001` |
| Expiry| any future date |
| OTP   | from Payme test docs |

---

## 3. Manual test flows

### 3.1 Successful payment (Payme)

1. Login → add product to cart → checkout
2. Select **Payme** → place order
3. Redirect to `checkout.test.paycom.uz`
4. Pay with test card
5. Return to `/payment/result?orderId=...&gateway=payme`
6. Verify:
   - Order `paymentStatus = paid`, `status = processing`
   - Product stock reduced
   - `payments` collection has `gateway: payme`, `status: paid`
   - `paymentlogs` has `CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`

### 3.2 Successful payment (Click)

Same flow with **Click** button → Click payment page → callback updates order.

### 3.3 Failed payment

- Cancel on gateway page or use declined test card
- Order stays `paymentStatus: pending` or moves to `failed`/`cancelled`
- Stock **not** reduced for gateway orders until `PerformTransaction` / Click `action=1`

### 3.4 Pending + retry

- Open `/payment/result?orderId=<id>` — polls status every 3s
- Retry payment: `POST /api/payment/payme/init` with `{ orderId, amount }` or `POST /api/payments/init` with `{ orderId, gateway: "payme" }`

### 3.5 Refund (admin)

```bash
curl -X POST http://localhost:5000/api/payments/<paymentId>/refund \
  -H "Authorization: Bearer <admin_token>"
```

---

## 4. cURL — Payme Merchant API (webhook simulation)

Replace `KEY`, `ORDER_ID`, `AMOUNT_TIYN` (UZS × 100).

```bash
# Auth: Basic base64("Paycom:KEY")
AUTH=$(printf 'Paycom:YOUR_KEY' | base64 -w0)

# CheckPerformTransaction
curl -s -X POST http://localhost:5000/api/payments/payme/webhook \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"CheckPerformTransaction",
    "params":{"amount":50000000,"account":{"order_id":"ORDER_MONGO_ID"}}
  }'

# CreateTransaction
curl -s -X POST http://localhost:5000/api/payments/payme/webhook \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"CreateTransaction",
    "params":{"id":"TXN001","time":'$(date +%s000)',"amount":50000000,"account":{"order_id":"ORDER_MONGO_ID"}}
  }'

# PerformTransaction
curl -s -X POST http://localhost:5000/api/payments/payme/webhook \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"PerformTransaction",
    "params":{"id":"TXN001"}
  }'
```

---

## 5. cURL — Click callback simulation

```bash
# Build sign_string = md5(click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time)
SIGN_TIME=$(date +%s)
# Use PHP or openssl to compute MD5 — example with known values:

curl -s "http://localhost:5000/api/payments/click/callback?\
service_id=SERVICE&merchant_id=MERCHANT_USER&amount=500000.00&\
transaction_param=ORDER_ID&merchant_trans_id=ORDER_ID&\
click_trans_id=12345&action=0&sign_time=$SIGN_TIME&sign_string=COMPUTED_MD5"
```

---

## 6. Security test cases

| Test | Expected |
|------|----------|
| Invalid Payme Basic auth | `-32504` Authorization error |
| Amount tampering (wrong tiyn) | `-31001` Invalid amount |
| Replay PerformTransaction | Idempotent success |
| Invalid Click signature | `error: -1` SIGN CHECK FAILED |
| Rate limit (>200/min/IP) | HTTP 429 |

---

## 7. Error codes reference

### Payme

| Code | Meaning |
|------|---------|
| -31001 | Invalid amount |
| -31003 | Transaction not found |
| -31008 | Unable to perform |
| -31050 | Order not found |
| -31051 | Order already paid |
| -31052 | Order cancelled |
| -32504 | Auth error |
| -32601 | Method not found |

### Click

| Code | Meaning |
|------|---------|
| -1 | Sign check failed |
| -2 | Incorrect amount |
| -4 | Already paid |
| -5 | Order not found |
| -9 | Order cancelled |

---

## 8. Database collections

### `payments`

| Field | Description |
|-------|-------------|
| order | Order ObjectId |
| gateway | `payme` \| `click` |
| transactionId | Gateway transaction ID |
| amount | UZS |
| amountTiyn | Payme tiyn |
| status | pending / paid / failed / refunded |
| paymeState | 1, 2, -1, -2 |

### `paymentlogs`

Audit trail for every webhook/callback request and response.

---

## 9. Test plan checklist (JSON)

See `docs/payment-test-cases.json` for structured QA cases.

---

## 10. Bug report template

```
**Gateway:** Payme / Click
**Order ID:**
**Transaction ID:**
**Expected:**
**Actual:**
**paymentlogs entry ID:**
**Steps to reproduce:**
**Environment:** test / production
```
