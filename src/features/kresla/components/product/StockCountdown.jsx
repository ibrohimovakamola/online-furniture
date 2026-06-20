import { getStockCount } from '../../utils/stock'

export default function StockCountdown({ productId }) {
  const n = getStockCount(productId)
  const low = n <= 3
  const pct = (n / 10) * 100

  return (
    <div className="mt-4 space-y-2">
      <p
        className={`text-sm font-medium ${
          low ? 'text-red-600 animate-pulseStock' : 'text-amber-600'
        }`}
      >
        ⚠️ Faqat {n} ta qoldi!
      </p>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${low ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
