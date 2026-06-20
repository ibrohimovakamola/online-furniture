# mebelsotish.uz — Backend API

Production-ready **Node.js + Express 5 + MongoDB (Mongoose)** backend for the furniture e-commerce platform.

> **Location:** all backend code lives in `server/` (not project root `/src`).

---

## Project structure

```
server/
├── src/
│   ├── config/          # DB connection, roles, payment, Cloudinary
│   ├── controllers/     # Business logic (auth, products, orders, cart, …)
│   ├── middleware/      # auth, validation (Joi), security, errors, upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers → mount under /api/*
│   ├── utils/           # JWT, mailer, seeds, helpers
│   ├── validators/      # Joi request schemas
│   ├── app.js           # Express app (middleware + routes)
│   └── server.js        # HTTP server, DB connect, graceful shutdown
├── uploads/             # Local product images (production: writable)
├── .env.example         # Dev template
└── .env.production.example
```

---

## Core dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP API |
| `mongoose` | MongoDB ODM |
| `dotenv` | Environment variables |
| `cors` | Cross-origin (dev); same-origin proxy in production |
| `helmet` | Security headers |
| `morgan` | HTTP access logging |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | Access + refresh tokens |
| `multer` | Image upload to `uploads/` |
| `joi` | Request validation (instead of express-validator) |
| `cookie-parser` | Refresh token cookies |
| `express-rate-limit` | API throttling |
| `express-mongo-sanitize` | NoSQL injection protection |
| `nodemailer` | Order / reset emails |

Dev uses `node --watch` (built-in); no separate `nodemon` required.

---

## Environment (`.env`)

Copy `server/.env.example` → `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=memory                    # dev; use Atlas URI in production
JWT_SECRET=change-me-min-32-chars
REFRESH_SECRET=different-min-32-chars
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
```

Production: see `server/.env.production.example` and [deploy/mebelsotish.uz/DEPLOY.md](../deploy/mebelsotish.uz/DEPLOY.md).

---

## Database models (your spec → implementation)

| Spec | Model file | Notes |
|------|------------|-------|
| **User** | `models/User.js` | email, password hash, role, phone, address, timestamps |
| **Product** | `models/Product.js` | name, description, price, category, images, stock, specs |
| **Category** | `models/Category.js` | `name_uz`, `name_ru`, `name_en`, slug + legacy `name` |
| **Order** | `models/Order.js` | user/guest, items, total, status, shipping, paymentStatus |
| **Cart** | `models/Cart.js` | userId, items — **server-side** for logged-in users |

Additional models: Blog, Gallery, FAQ, Page, Payment, B2B, Settings.

---

## API overview

| Prefix | Routes file | Description |
|--------|-------------|-------------|
| `/api/health` | `app.js` | Health + DB ping |
| `/api/auth` | `auth.routes.js` | Signup, login, profile, logout, JWT refresh |

### Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Register (`email`, `password`, `name` or `firstName`) |
| POST | `/api/auth/login` | — | Login → JWT + refresh cookie |
| GET | `/api/auth/me` | Bearer | Current user |
| PUT | `/api/auth/profile` | Bearer | Update name, phone, address |
| POST | `/api/auth/logout` | Bearer | Revoke refresh token |
| DELETE | `/api/auth/account` | Bearer | Delete own account |
| POST | `/api/auth/refresh` | Cookie | Rotate access token |

Response example:

```json
{
  "success": true,
  "message": "Login successful",
  "data": { "user": { "id", "email", "name", "phone", "role" }, "token": "..." },
  "token": "...",
  "user": { "...": "legacy fields for existing frontend" }
}
```
| `/api/cart` | `cart.routes.js` | Authenticated cart CRUD |
| `/api/products` | `products.routes.js` | Catalog, search, filters |
| `/api/orders` | `orders.routes.js` | Checkout, guest orders, tracking |
| `/api/payments` | `payments.routes.js` | Payme, Click |
| `/api/admin` | `admin.routes.js` | Admin CRUD |
| `/api/store` | `store.routes.js` | Storefront data |

### Cart endpoints (auth required)

```
GET    /api/cart
PUT    /api/cart              { items: [{ productId, quantity, color? }] }
POST   /api/cart/items        { productId, quantity, color? }
PATCH  /api/cart/items/:itemId   { quantity }
DELETE /api/cart/items/:itemId
DELETE /api/cart
```

---

## Middleware stack (`app.js`)

1. `helmet` — security headers  
2. `morgan` — request logging  
3. `cors` — origin whitelist from `CORS_ORIGIN` / `CLIENT_URL`  
4. `cookie-parser`  
5. `express.json` / `urlencoded`  
6. Mongo sanitize + XSS (Express 5 compatible)  
7. Rate limiter on `/api/`  
8. Static `/uploads`  
9. Routes  
10. `notFound` → `errorHandler`

---

## Run locally

```bash
# From project root
cp server/.env.example server/.env
npm run dev          # Vite :5173 + API :5000

# API only
npm run dev:server
```

Health: http://localhost:5000/api/health

---

## Production

```bash
pm2 start pm2.config.cjs --env production
```

Full runbook: [deploy/mebelsotish.uz/DEPLOY.md](../deploy/mebelsotish.uz/DEPLOY.md).

---

## Error responses

All errors return JSON:

```json
{
  "success": false,
  "message": "Human-readable message",
  "statusCode": 400,
  "errorId": "ERR-A1B2C3",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation / malformed input |
| 401 | Missing or invalid JWT |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, etc.) |
| 422 | Business rule (e.g. insufficient stock) |
| 429 | Rate limit exceeded |
| 500 | Server error |

Validation, duplicate key, cast errors, and DB unavailable are mapped in `middleware/errorHandler.js`.

---

## API documentation (Swagger / OpenAPI)

Interactive docs are served when the server runs in development, or when `SWAGGER_ENABLED=true` in production.

| URL | Description |
|-----|-------------|
| http://localhost:5000/api-docs | Swagger UI |
| http://localhost:5000/api-docs.json | Raw OpenAPI 3.0 JSON |

**Setup files:**

- `src/swagger.js` — swagger-jsdoc + swagger-ui-express config
- `src/docs/swagger/*.js` — path definitions by domain (auth, products, orders, admin, misc)
- Route files include `@swagger` JSDoc blocks above handlers

**Authorize in Swagger UI:** click **Authorize**, paste `Bearer <token>` from `POST /api/auth/login`.

---

## Postman collection

Import into Postman:

1. `postman/mebelsotish.uz.postman_collection.json`
2. `postman/mebelsotish.uz.postman_environment.json`

Folders: **Health**, **Auth**, **Products**, **Orders**, **Admin**.

The collection pre-request script sets `Authorization: Bearer {{accessToken}}` after you run **Auth → Login**. Login also stores the refresh cookie for **Refresh Token**.

---

## Tests

```bash
cd server
npm install
npm test              # run all tests
npm run test:coverage # Jest coverage report (≥30% threshold)
```

| Path | Coverage |
|------|----------|
| `tests/unit/models/` | User, Product, Order schemas |
| `tests/unit/middleware/` | Joi `validateRequest` |
| `tests/auth.test.js` | Signup, login, refresh, profile |
| `tests/products.test.js` | List, detail, categories, auth guards |
| `tests/orders.test.js` | Cart → order, guest order, admin status |

Tests use in-memory MongoDB (`MONGODB_URI=memory`) and disable rate limits (`NODE_ENV=test`).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | dev | `development` \| `production` \| `test` |
| `PORT` | no | HTTP port (default `5000`) |
| `MONGODB_URI` | dev | `memory` (dev) or Atlas/local URI |
| `JWT_SECRET` | yes | Access token secret (min 32 chars prod) |
| `REFRESH_SECRET` | yes | Refresh token secret |
| `CORS_ORIGIN` | dev | Allowed browser origins (comma-separated) |
| `CLIENT_URL` | dev | Frontend URL for emails/redirects |
| `SWAGGER_ENABLED` | no | Set `true` to expose `/api-docs` in production |
| `API_RATE_LIMIT_MAX` | no | General API limit/hour (default 100) |
| `AUTH_RATE_LIMIT_MAX` | no | Login attempts/15 min (default 5) |
| `PAYME_*` / `CLICK_*` | no | Payment gateway credentials |
| `SMTP_*` / `EMAIL_*` | no | Email notifications |

See `server/.env.example` and `server/.env.production.example` for the full list.

---

## API endpoints overview

Base URL: `http://localhost:5000` (dev) or `https://mebelsotish.uz` (production).

### Authentication

All protected routes: `Authorization: Bearer <accessToken>`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Register customer |
| POST | `/api/auth/login` | — | Login → JWT + refresh cookie |
| POST | `/api/auth/refresh` | cookie | Rotate access token |
| POST | `/api/auth/logout` | JWT | Revoke session |
| GET | `/api/auth/me` | JWT | Current profile |

### Products & categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | — | List / filter / paginate |
| GET | `/api/products/:id` | — | Product detail |
| GET | `/api/products/search?q=` | — | Full-text search |
| GET | `/api/categories` | — | Category list |

### Cart & orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart` | JWT | Get cart |
| POST | `/api/cart` | JWT | Add item |
| POST | `/api/orders` | JWT | Create order from cart |
| GET | `/api/orders` | JWT | List user orders |
| POST | `/api/orders/guest` | — | Guest checkout |

### Admin (JWT + `super_admin` \| `manager`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard/stats` | Dashboard KPIs |
| GET | `/api/admin/products` | Manage products |
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/:id/status` | Update status |
| GET | `/api/admin/analytics/overview` | Analytics |

---

## Example curl commands

**Health check:**

```bash
curl http://localhost:5000/api/health
```

**Signup:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"SecurePass1!","name":"Ali Valiyev"}'
```

**Login (save token):**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"SecurePass1!"}'
```

**List products:**

```bash
curl "http://localhost:5000/api/products?page=1&limit=10&lang=uz"
```

**Authenticated cart:**

```bash
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create order (cash):**

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "fullName": "Ali Valiyev",
      "phone": "+998901234567",
      "email": "you@example.com",
      "street": "Amir Temur 1",
      "city": "Tashkent"
    },
    "paymentMethod": "cash"
  }'
```

---

## Rate limits

| Scope | Default limit |
|-------|----------------|
| `/api/*` | 100 requests / hour / IP |
| `/api/auth/login` | 5 failed attempts / 15 min |
| `/api/auth/forgot-password` | 3 / hour |
| `/api/contact` | 10 / hour |

Webhooks (`/api/payments/payme-callback`, etc.) and `/api/health` are excluded from the general limit.
