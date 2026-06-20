<?php
declare(strict_types=1);

namespace App\Helpers;

final class ValidationHelper
{
    public static function email(string $value): bool
    {
        return (bool) filter_var($value, FILTER_VALIDATE_EMAIL);
    }

    public static function required(?string $value): bool
    {
        return $value !== null && trim($value) !== '';
    }

    public static function minLength(string $value, int $min): bool
    {
        return mb_strlen($value) >= $min;
    }

    public static function phoneUz(string $value): bool
    {
        return (bool) preg_match('/^\+998\d{9}$/', preg_replace('/\s+/', '', $value));
    }
}
