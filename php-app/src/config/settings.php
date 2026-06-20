<?php
declare(strict_types=1);

use App\Config\Bootstrap;

return [
    'app' => [
        'name' => Bootstrap::env('APP_NAME', 'MebelSotish'),
        'url' => Bootstrap::env('APP_URL', 'https://mebelsotish.uz'),
        'env' => Bootstrap::env('APP_ENV', 'production'),
    ],
    'mail' => [
        'host' => Bootstrap::env('MAIL_HOST', ''),
        'port' => (int) Bootstrap::env('MAIL_PORT', '587'),
        'user' => Bootstrap::env('MAIL_USER', ''),
        'pass' => Bootstrap::env('MAIL_PASS', ''),
        'from' => Bootstrap::env('MAIL_FROM', 'noreply@mebelsotish.uz'),
    ],
    'security' => [
        'csrf_enabled' => true,
        'rate_limit_per_minute' => (int) Bootstrap::env('RATE_LIMIT', '120'),
    ],
    'api' => [
        'node_backend' => Bootstrap::env('NODE_API_URL', 'http://127.0.0.1:5000/api'),
    ],
];
