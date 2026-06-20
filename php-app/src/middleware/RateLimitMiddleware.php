<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Config\Bootstrap;

final class RateLimitMiddleware
{
    public function handle(): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $limit = (int) Bootstrap::env('RATE_LIMIT', '120');
        $key = 'rl_' . md5($ip);
        $file = APP_ROOT . '/cache/' . $key . '.json';
        $now = time();
        $window = 60;

        $data = ['count' => 0, 'start' => $now];
        if (is_file($file)) {
            $data = json_decode((string) file_get_contents($file), true) ?: $data;
        }
        if ($now - ($data['start'] ?? 0) > $window) {
            $data = ['count' => 0, 'start' => $now];
        }
        $data['count'] = ($data['count'] ?? 0) + 1;
        if (!is_dir(APP_ROOT . '/cache')) {
            mkdir(APP_ROOT . '/cache', 0750, true);
        }
        file_put_contents($file, json_encode($data));

        if ($data['count'] > $limit) {
            http_response_code(429);
            header('Retry-After: 60');
            echo 'Too many requests';
            exit;
        }
    }
}
