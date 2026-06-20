<?php
declare(strict_types=1);

namespace App\Helpers;

use App\Config\Bootstrap;

final class EmailHelper
{
    public static function send(string $to, string $subject, string $body): bool
    {
        $from = Bootstrap::env('MAIL_FROM', 'noreply@mebelsotish.uz');
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: ' . $from,
        ];
        return mail($to, $subject, $body, implode("\r\n", $headers));
    }
}
