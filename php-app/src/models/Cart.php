<?php
declare(strict_types=1);

namespace App\Models;

class Cart
{
    public function getSessionItems(): array
    {
        return $_SESSION['cart'] ?? [];
    }

    public function addItem(int $productId, int $qty): void
    {
        $_SESSION['cart'] ??= [];
        $_SESSION['cart'][$productId] = ($_SESSION['cart'][$productId] ?? 0) + $qty;
    }
}
