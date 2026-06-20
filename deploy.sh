#!/usr/bin/env bash
# Server-side deploy — run from project root on the production host.
#
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Optional env overrides:
#   FRONTEND_DIR=/home/user/public_html  — rsync dist/ here after build
#   GIT_BRANCH=main
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${GIT_BRANCH:-main}"
FRONTEND_DIR="${FRONTEND_DIR:-}"

echo "🚀 Starting deployment..."
cd "$APP_DIR"

echo "📥 Pulling latest code ($BRANCH)..."
git pull origin "$BRANCH"

echo "📦 Installing dependencies..."
npm ci
npm ci --prefix server --omit=dev

echo "🏗️  Building frontend..."
if [ -f .env.production ]; then
  npm run build:prod
else
  echo "   (no .env.production — using npm run build)"
  npm run build
fi

if [ -n "$FRONTEND_DIR" ]; then
  echo "📤 Syncing dist/ → $FRONTEND_DIR"
  mkdir -p "$FRONTEND_DIR"
  rsync -a --delete dist/ "$FRONTEND_DIR/"
  if [ -f deploy/mebelsotish.uz/.htaccess ]; then
    cp deploy/mebelsotish.uz/.htaccess "$FRONTEND_DIR/.htaccess"
  fi
fi

echo "🗄️  Running migrations (if configured)..."
npm run migrate --if-present

echo "♻️  Restarting API..."
if pm2 describe mebel-api >/dev/null 2>&1; then
  pm2 restart mebel-api
else
  pm2 start pm2.config.cjs --env production
fi
pm2 save

echo "✅ Deployment complete!"
