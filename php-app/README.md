# PHP MVC Scaffold (`php-app/`)

Reference PHP structure for **cPanel / Apache** hosting (mebelsotish.uz).

> **Note:** The main Exclusive project is **React + Vite + Express + MongoDB** (`/` and `/server`).  
> Use this `php-app/` folder only if you deploy a PHP storefront or need a classic MVC layer on shared hosting.

## Structure

```
php-app/
├── public/          ← Document root (point domain here)
├── src/
│   ├── config/      ← database, constants, bootstrap
│   ├── controllers/
│   ├── models/
│   ├── views/
│   ├── helpers/
│   ├── middleware/
│   └── core/        ← Base Controller, Model, Router
├── admin/
├── uploads/
├── logs/
└── cache/
```

## Setup

```bash
cd php-app
composer install
cp .env.example .env
# Edit .env — never commit real credentials
```

Apache `DocumentRoot` → `php-app/public`

## Permissions (Linux/cPanel)

```bash
chmod 750 logs cache uploads/temp
chmod 640 .env
```

## Security

- Credentials only in `.env`
- `AuthMiddleware` + `RateLimitMiddleware` included
- HTTPS forced via `public/.htaccess` and `SslHelper`

See `deploy/mebelsotish.uz/SSL-SETUP.md` for Let's Encrypt on production.
