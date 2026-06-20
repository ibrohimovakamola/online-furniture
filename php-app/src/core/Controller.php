<?php
declare(strict_types=1);

namespace App\Core;

use App\Config\Bootstrap;

abstract class Controller
{
    protected function view(string $template, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        $path = APP_ROOT . '/src/views/' . $template . '.php';
        if (!is_file($path)) {
            $this->error('View not found', 500);
        }
        require APP_ROOT . '/src/views/layouts/main.php';
    }

    protected function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    protected function redirect(string $url, int $status = 302): void
    {
        header('Location: ' . $url, true, $status);
        exit;
    }

    protected function input(string $key, mixed $default = null): mixed
    {
        return $_POST[$key] ?? $_GET[$key] ?? $default;
    }

    protected function requireAuth(): void
    {
        if (empty($_SESSION['user_id'])) {
            $this->redirect('/login');
        }
    }

    protected function error(string $message, int $status = 400): void
    {
        Bootstrap::log('error', $message, ['status' => $status]);
        if ($this->wantsJson()) {
            $this->json(['success' => false, 'message' => $message], $status);
        }
        http_response_code($status);
        echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        exit;
    }

    protected function wantsJson(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return str_contains($accept, 'application/json');
    }
}
