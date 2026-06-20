# Local production build helper (Windows)
# Usage: .\scripts\deploy-build.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root

Write-Host "Installing dependencies..."
npm ci
npm ci --prefix server

if (-not (Test-Path ".env.production")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.production"
        Write-Host "Created .env.production from .env.example"
    }
}

Write-Host "Building frontend..."
npm run build

Write-Host ""
Write-Host "Build complete: dist/"
Write-Host "Next steps:"
Write-Host "  1. Upload dist/* to public_html/"
Write-Host "  2. Copy deploy/mebelsotish.uz/.htaccess to public_html/"
Write-Host "  3. Configure server/.env on the server"
Write-Host "  4. npm install -g pm2 && pm2 start pm2.config.cjs --env production"
Write-Host ""
Write-Host "Full guide: deploy/mebelsotish.uz/DEPLOY.md"
