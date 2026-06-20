<?php
declare(strict_types=1);

namespace App\Helpers;

final class PaymentHelper
{
    /** Placeholder for Payme / Click / Stripe integration */
    public static function createPaymentIntent(int $orderId, int $amountUzs): array
    {
        return [
            'order_id' => $orderId,
            'amount' => $amountUzs,
            'currency' => 'UZS',
            'status' => 'pending',
        ];
    }
}
