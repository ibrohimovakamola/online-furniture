<?php
declare(strict_types=1);

namespace App\Helpers;

/**
 * SSL / HTTPS utilities for shared hosting (cPanel, Apache).
 */
final class SslHelper
{
    public static function isHttps(): bool
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
            return true;
        }
        return (int) ($_SERVER['SERVER_PORT'] ?? 80) === 443;
    }

    public static function forceHttps(): void
    {
        if (self::isHttps()) {
            return;
        }
        $host = $_SERVER['HTTP_HOST'] ?? 'mebelsotish.uz';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        header('Location: https://' . $host . $uri, true, 301);
        exit;
    }

    /** Detect mixed-content risk when page is HTTPS but asset URLs are HTTP */
    public static function hasMixedContentUrls(array $urls): array
    {
        if (!self::isHttps()) {
            return [];
        }
        return array_values(array_filter($urls, static fn ($url) => is_string($url) && str_starts_with($url, 'http://')));
    }
}
