<?php
declare(strict_types=1);

namespace App\Config;

use Dotenv\Dotenv;

final class Bootstrap
{
    public static function init(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start([
                'cookie_httponly' => true,
                'cookie_secure' => self::isHttps(),
                'cookie_samesite' => 'Lax',
            ]);
        }

        if (is_file(APP_ROOT . '/.env')) {
            Dotenv::createImmutable(APP_ROOT)->safeLoad();
        }

        date_default_timezone_set(self::env('APP_TIMEZONE', 'Asia/Tashkent'));
        error_reporting(self::env('APP_DEBUG', 'false') === 'true' ? E_ALL : 0);
        ini_set('display_errors', self::env('APP_DEBUG', 'false') === 'true' ? '1' : '0');
    }

    public static function env(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? getenv($key);
        return $value !== false && $value !== '' ? (string) $value : $default;
    }

    public static function isHttps(): bool
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            return true;
        }
        return (int) ($_SERVER['SERVER_PORT'] ?? 80) === 443;
    }

    public static function log(string $level, string $message, array $context = []): void
    {
        $dir = APP_ROOT . '/logs';
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        $line = json_encode([
            'time' => date('c'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
        file_put_contents($dir . '/app.log', $line, FILE_APPEND | LOCK_EX);
    }
}
