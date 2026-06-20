<?php
declare(strict_types=1);

namespace App\Gateways;

/**
 * Payme (paycom.uz) Merchant API + Checkout wrapper.
 * Production: point webhooks to Node API or implement identically here.
 */
final class PaymeGateway
{
    public const STATE_CREATED = 1;
    public const STATE_COMPLETED = 2;
    public const STATE_CANCELLED_BEFORE = -1;
    public const STATE_CANCELLED_AFTER = -2;

    private string $merchantId;
    private string $key;
    private string $checkoutBase;
    private string $returnUrl;
    private array $allowedIps;

    public function __construct(?array $config = null)
    {
        $config ??= [];
        $this->merchantId = (string) ($config['merchant_id'] ?? getenv('PAYME_MERCHANT_ID') ?: '');
        $this->key = (string) ($config['key'] ?? getenv('PAYME_KEY') ?: '');
        $testMode = ($config['test_mode'] ?? getenv('PAYME_TEST_MODE') ?: 'true') !== 'false';
        $this->checkoutBase = (string) ($config['checkout_url'] ?? (
            $testMode ? 'https://checkout.test.paycom.uz' : 'https://checkout.paycom.uz'
        ));
        $clientUrl = rtrim((string) (getenv('CLIENT_URL') ?: 'http://localhost:5173'), '/');
        $this->returnUrl = (string) ($config['return_url'] ?? getenv('PAYME_RETURN_URL') ?: "{$clientUrl}/payment/result");
        $ips = (string) (getenv('PAYME_ALLOWED_IPS') ?: '');
        $this->allowedIps = array_filter(array_map('trim', explode(',', $ips)));
    }

    public function isConfigured(): bool
    {
        return $this->merchantId !== '' && $this->key !== '';
    }

    public function verifyAuth(?string $authorizationHeader): bool
    {
        if ($authorizationHeader === null || !str_starts_with($authorizationHeader, 'Basic ')) {
            return false;
        }
        $decoded = base64_decode(substr($authorizationHeader, 6), true);
        if ($decoded === false) {
            return false;
        }
        [$user, $pass] = array_pad(explode(':', $decoded, 2), 2, '');
        return $user === 'Paycom' && hash_equals($this->key, $pass);
    }

    public function isAllowedIp(string $ip): bool
    {
        if ($this->allowedIps === []) {
            return true;
        }
        $ip = str_replace('::ffff:', '', $ip);
        return in_array($ip, $this->allowedIps, true);
    }

    /** @return array{m:string,ac:array{order_id:string},a:int,c?:string,l:string} */
    public function buildCheckoutPayload(string $orderId, float $amountUzs, string $lang = 'uz'): array
    {
        return [
            'm' => $this->merchantId,
            'ac' => ['order_id' => $orderId],
            'a' => (int) round($amountUzs * 100),
            'c' => $this->returnUrl,
            'l' => $lang,
        ];
    }

    public function generatePaymentUrl(string $orderId, float $amountUzs, ?string $returnUrl = null, string $lang = 'uz'): string
    {
        $payload = $this->buildCheckoutPayload($orderId, $amountUzs, $lang);
        if ($returnUrl !== null) {
            $payload['c'] = $returnUrl;
        }
        $encoded = base64_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
        return rtrim($this->checkoutBase, '/') . '/' . $encoded;
    }

    public function signPayload(array $payload): string
    {
        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE));
    }

    /** JSON-RPC error envelope */
    public function buildError(int $code, array $message, $id, $data = null): array
    {
        return [
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => ['code' => $code, 'message' => $message, 'data' => $data],
        ];
    }

    public function buildResult($result, $id): array
    {
        return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
    }
}
