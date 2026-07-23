import { formatSom } from '@/features/kresla/utils/formatPrice'

const OPTIONS = [
  { id: 'payme', icon: '💳', label: 'Payme' },
  { id: 'click', icon: '💳', label: 'Click' },
  { id: 'uzumbank', icon: '🏦', label: 'Uzum Bank' },
]

/**
 * Radio-style payment gateway picker for installment checkout.
 */
export default function InstallmentPaymentSelector({
  value,
  onChange,
  installmentPlan,
  gateways = {},
  loading = false,
  error = '',
}) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm font-semibold text-kresla-dark">To&apos;lov tizimini tanlang</p>

      <div
        role="radiogroup"
        aria-label="To'lov tizimi"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {OPTIONS.map(({ id, icon, label }) => {
          const selected = value === id
          const configured = gateways[id] !== false

          return (
            <label
              key={id}
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                selected
                  ? 'border-green-600 bg-green-50 shadow-sm ring-1 ring-green-600/30'
                  : 'border-gray-200 bg-white hover:border-green-400/60'
              } ${loading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="installmentPaymentGateway"
                value={id}
                checked={selected}
                disabled={loading}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${
                  selected ? 'bg-green-100' : 'bg-gray-50'
                }`}
                aria-hidden
              >
                {icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${selected ? 'text-green-800' : 'text-kresla-dark'}`}>
                  {label}
                </span>
                {!configured && (
                  <span className="block text-xs text-amber-600 mt-0.5">Sozlanmagan</span>
                )}
              </span>
              {selected && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-green-600" aria-hidden />
              )}
            </label>
          )
        })}
      </div>

      {value && installmentPlan && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Birinchi oylik to&apos;lov ({installmentPlan.planMonths} oy):{' '}
          <strong>{formatSom(installmentPlan.monthlyPayment)}</strong>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
