<?php
declare(strict_types=1);

namespace App\Gateways;

/**
 * Click (my.click.uz) SHOP-API wrapper.
 */
final class ClickGateway
{
    private string $serviceId;
    private string $merchantUserId;
    private string $secretKey;
    private string $payUrl;
    private string $returnUrl;

    public function __construct(?array $config = null)
    {
        $config ??= [];
        $this->serviceId = (string) ($config['service_id'] ?? getenv('CLICK_SERVICE_ID') ?: '');
        $this->merchantUserId = (string) ($config['merchant_id'] ?? getenv('CLICK_MERCHANT_ID') ?: '');
        $this->secretKey = (string) ($config['secret_key'] ?? getenv('CLICK_SECRET_KEY') ?: '');
        $this->payUrl = (string) ($config['pay_url'] ?? 'https://my.click.uz/services/pay');
        $clientUrl = rtrim((string) (getenv('CLIENT_URL') ?: 'http://localhost:5173'), '/');
        $this->returnUrl = (string) ($config['return_url'] ?? getenv('CLICK_RETURN_URL') ?: "{$clientUrl}/payment/result");
    }

    public function isConfigured(): bool
    {
        return $this->serviceId !== '' && $this->merchantUserId !== '' && $this->secretKey !== '';
    }

    public function generatePaymentUrl(string $orderId, float $amountUzs, ?string $returnUrl = null): string
    {
        $params = http_build_query([
            'service_id' => $this->serviceId,
            'merchant_id' => $this->merchantUserId,
            'amount' => number_format($amountUzs, 2, '.', ''),
            'transaction_param' => $orderId,
            'return_url' => $returnUrl ?? $this->returnUrl,
        ]);
        return $this->payUrl . '?' . $params;
    }

    public function generateSignature(
        string $clickTransId,
        string $serviceId,
        string $merchantTransId,
        string $amount,
        int $action,
        string $signTime
    ): string {
        $raw = $clickTransId . $serviceId . $this->secretKey . $merchantTransId . $amount . $action . $signTime;
        return md5($raw);
    }

    /** @param array<string, scalar> $params */
    public function verifySignature(array $params): bool
    {
        $expected = $this->generateSignature(
            (string) ($params['click_trans_id'] ?? ''),
            (string) ($params['service_id'] ?? ''),
            (string) ($params['merchant_trans_id'] ?? ''),
            (string) ($params['amount'] ?? ''),
            (int) ($params['action'] ?? 0),
            (string) ($params['sign_time'] ?? '')
        );
        return hash_equals($expected, (string) ($params['sign_string'] ?? ''));
    }

    public function successResponse(string $merchantConfirmId, string $merchantTransId): array
    {
        return [
            'click_trans_id' => $merchantConfirmId,
            'merchant_trans_id' => $merchantTransId,
            'merchant_confirm_id' => $merchantConfirmId,
            'error' => 0,
            'error_note' => 'Success',
        ];
    }

    public function errorResponse(int $error, string $note, ?string $merchantTransId = null): array
    {
        return [
            'error' => $error,
            'error_note' => $note,
            'merchant_trans_id' => $merchantTransId,
        ];
    }
}
