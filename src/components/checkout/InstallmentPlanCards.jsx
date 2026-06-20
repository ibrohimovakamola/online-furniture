import { formatSom } from '../../features/kresla/utils/formatPrice'
import { formatInstallmentLabel } from '../../utils/installmentPlans'

export default function InstallmentPlanCards({
  plans,
  selectedMonths,
  onSelect,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[3, 6, 12].map((m) => (
          <div
            key={m}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    )
  }

  if (!plans?.length) return null

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {plans.map((plan) => {
        const active = selectedMonths === plan.planMonths
        return (
          <button
            key={plan.planMonths}
            type="button"
            onClick={() => onSelect(plan.planMonths)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              active
                ? 'border-kresla-primary bg-kresla-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-kresla-primary/40'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-kresla-primary">
              {plan.planMonths} oy
            </p>
            <p className="mt-1 text-lg font-semibold text-kresla-dark">
              {formatSom(plan.monthlyPayment)}
              <span className="text-sm font-normal text-gray-500">/oy</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {plan.markupPercent === 0 ? '0% ustama' : `${plan.markupPercent}% ustama`}
            </p>
            <p className="mt-2 text-xs text-gray-400">{formatInstallmentLabel(plan.planMonths)}</p>
          </button>
        )
      })}
    </div>
  )
}

export function InstallmentSummary({ plan, baseAmount }) {
  if (!plan) return null

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-kresla-primary/20 bg-kresla-primary/5 p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Mahsulot narxi</span>
        <span className="font-medium">{formatSom(baseAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Bo&apos;lib to&apos;lash ustamasi</span>
        <span className="font-medium">
          {plan.markupPercent === 0 ? '—' : formatSom(plan.markupAmount)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Oylik to&apos;lov</span>
        <span className="font-semibold text-kresla-primary">{formatSom(plan.monthlyPayment)}</span>
      </div>
      <div className="flex justify-between border-t border-kresla-primary/15 pt-2">
        <span className="font-medium text-kresla-dark">Jami to&apos;lanadi</span>
        <span className="font-semibold text-kresla-dark">
          {formatSom(plan.totalAmountWithInterest)}
        </span>
      </div>
    </div>
  )
}
