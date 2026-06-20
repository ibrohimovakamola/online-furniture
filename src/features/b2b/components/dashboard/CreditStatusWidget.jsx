import { formatSom } from '@/features/kresla/utils/formatPrice'

export default function CreditStatusWidget({ stats, profile }) {
  const balance = stats?.accountBalance ?? profile?.accountBalance ?? 0
  const limit = stats?.creditLimit ?? profile?.creditLimit ?? 0
  const available = stats?.creditAvailable ?? Math.max(limit - balance, 0)
  const terms = stats?.creditTerms ?? profile?.creditTerms ?? 'prepay'

  return (
    <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5 h-full">
      <h3 className="font-semibold text-kresla-dark mb-4">Credit & Payment Status</h3>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Payment terms</dt>
          <dd className="font-semibold uppercase">{terms.replace('_', ' ')}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Current balance</dt>
          <dd className="font-semibold">{formatSom(balance)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Credit limit</dt>
          <dd>{formatSom(limit)}</dd>
        </div>
        <div className="flex justify-between border-t pt-3">
          <dt className="text-gray-700 font-medium">Available credit</dt>
          <dd className="font-bold text-kresla-primary">{formatSom(available)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-gray-500">
        Due payments and full payment history are available under Account → Payment & Billing.
      </p>
    </div>
  )
}
