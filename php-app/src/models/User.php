<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class User extends Model
{
    protected string $table = 'users';

    public function findByEmail(string $email): ?array
    {
        $rows = $this->query('SELECT * FROM users WHERE email = :email LIMIT 1', ['email' => $email]);
        return $rows[0] ?? null;
    }
}
