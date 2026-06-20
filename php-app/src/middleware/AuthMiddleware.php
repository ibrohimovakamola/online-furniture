<?php
declare(strict_types=1);

namespace App\Middleware;

final class AuthMiddleware
{
    public function handle(): void
    {
        if (empty($_SESSION['user_id'])) {
            header('Location: /login', true, 302);
            exit;
        }
    }
}
