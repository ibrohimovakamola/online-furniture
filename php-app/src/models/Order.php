<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Order extends Model
{
    protected string $table = 'orders';

    public function forUser(int $userId): array
    {
        return $this->query('SELECT * FROM orders WHERE user_id = :uid ORDER BY id DESC', ['uid' => $userId]);
    }
}
