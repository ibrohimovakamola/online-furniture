<?php
/**
 * Upload to public_html for one-time SSL diagnostics. DELETE after use.
 */
header('Content-Type: application/json');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    || ((int) ($_SERVER['SERVER_PORT'] ?? 80) === 443);

echo json_encode([
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'https_active' => $https,
    'server_port' => $_SERVER['SERVER_PORT'] ?? null,
    'forwarded_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null,
    'recommendation' => $https ? 'OK' : 'Enable SSL and force HTTPS redirect',
], JSON_PRETTY_PRINT);
