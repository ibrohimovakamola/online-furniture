import { formatSom } from '../../features/kresla/utils/formatPrice'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function InstallmentProgress({ installmentDetails, compact = false }) {
  if (!installmentDetails) return null

  const { planMonths, paidMonths, monthlyPayment, remainingBalance, nextPaymentDate } =
    installmentDetails
  const progress = planMonths > 0 ? Math.min(100, (paidMonths / planMonths) * 100) : 0
  const isComplete = paidMonths >= planMonths

  if (compact) {
    return (
      <span className="text-xs text-kresla-primary">
        {paidMonths}/{planMonths} oy
      </span>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-kresla-dark">Bo&apos;lib to&apos;lash rejasi</h4>
        <span className="text-sm text-gray-500">
          {paidMonths} / {planMonths} oy to&apos;langan
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-kresla-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-gray-500">Oylik to&apos;lov</p>
          <p className="font-semibold text-kresla-dark">{formatSom(monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-gray-500">Qolgan summa</p>
          <p className="font-semibold text-kresla-dark">
            {isComplete ? formatSom(0) : formatSom(remainingBalance)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Keyingi to&apos;lov</p>
          <p className="font-semibold text-kresla-dark">
            {isComplete ? 'To\'liq to\'langan' : formatDate(nextPaymentDate)}
          </p>
        </div>
      </div>
    </div>
  )
}
