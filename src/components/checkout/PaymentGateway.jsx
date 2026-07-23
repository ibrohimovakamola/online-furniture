import { formatSom } from '@/features/kresla/utils/formatPrice'

const OPTIONS = [
  { id: 'payme', label: 'Payme', active: 'bg-[#00CCCC] text-white border-[#00CCCC]', idle: 'border-[#00CCCC] text-[#00CCCC]' },
  { id: 'click', label: 'Click', active: 'bg-[#2B2B7C] text-white border-[#2B2B7C]', idle: 'border-[#2B2B7C] text-[#2B2B7C]' },
  { id: 'uzumbank', label: 'Uzum Bank', active: 'bg-[#7000FF] text-white border-[#7000FF]', idle: 'border-[#7000FF] text-[#7000FF]' },
]

const GATEWAY_HINTS = {
  payme: 'Payme orqali xavfsiz to\'lov. "Buyurtma berish" tugmasidan so\'ng to\'lov sahifasiga yo\'naltirilasiz.',
  click: 'Click orqali xavfsiz to\'lov. "Buyurtma berish" tugmasidan so\'ng to\'lov sahifasiga yo\'naltirilasiz.',
  uzumbank: 'Uzum Bank orqali xavfsiz to\'lov. "Buyurtma berish" tugmasidan so\'ng to\'lov sahifasiga yo\'naltirilasiz.',
}

/**
 * Payment gateway selector for checkout (Payme, Click, Uzum Bank only).
 */
export default function PaymentGateway({
  gateways = {},
  selectedMethod,
  onSelect,
  mode = 'full',
  installmentPlan = null,
  orderTotal = 0,
  loading = false,
}) {
  const displayTotal =
    mode === 'installment' && installmentPlan
      ? installmentPlan.monthlyPayment
      : orderTotal

  const isGatewaySelected = ['payme', 'click', 'uzumbank'].includes(selectedMethod)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ id, label, active, idle }) => {
          const configured = gateways[id] !== false
          const isActive = selectedMethod === id
          return (
            <button
              key={id}
              type="button"
              disabled={loading}
              onClick={() => onSelect(id)}
              className={`px-4 py-2 rounded-lg text-sm border font-semibold transition disabled:opacity-60 ${
                isActive ? active : idle
              }`}
            >
              {label}
              {!configured && <span className="block text-[10px] font-normal opacity-80">Sozlanmagan</span>}
            </button>
          )
        })}
      </div>

      {isGatewaySelected && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600 space-y-2">
          <p>
            <strong>{OPTIONS.find((o) => o.id === selectedMethod)?.label}</strong> —{' '}
            {GATEWAY_HINTS[selectedMethod]}
          </p>
          {mode === 'installment' && installmentPlan && (
            <p className="text-kresla-primary font-medium">
              Birinchi oylik to&apos;lov: {formatSom(installmentPlan.monthlyPayment)}
            </p>
          )}
          {mode === 'full' && (
            <p>
              Jami: <strong>{formatSom(displayTotal)}</strong>
            </p>
          )}
          {selectedMethod === 'payme' && (
            <p className="text-xs text-gray-500">Test karta (Payme): 9860 0000 0000 0001</p>
          )}
          {gateways[selectedMethod] === false && (
            <p className="text-xs text-amber-700">
              Bu to&apos;lov tizimi serverda sozlanmagan. Admin <code>server/.env</code> faylida kalitlarni kiriting.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function parseGatewayResponse(response) {
  const root = response?.data?.data ?? response?.data ?? response
  const gateways = root?.gateways ?? root
  return {
    payme: Boolean(gateways?.payme?.enabled),
    click: Boolean(gateways?.click?.enabled),
    uzumbank: Boolean(gateways?.uzumbank?.enabled),
  }
}
