import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatSom } from '@/features/kresla/utils/formatPrice'
import { calculateB2BLinePrice } from '../../utils/pricing'

export default function BulkPriceModal({ product, open, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (open) setQty(1)
  }, [open, product?.id])

  if (!open || !product) return null

  const pricing = calculateB2BLinePrice({
    retailPrice: product.retailPrice,
    wholesalePrice: product.wholesalePrice,
    quantity: qty,
  })

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-kresla-dark">{product.name}</h3>
            <p className="text-xs text-gray-500">{product.sku || product.id}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg border border-[#0b3c3c]/20 px-3 py-2 text-sm mb-4"
        />

        <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
          <div className="flex justify-between">
            <dt className="text-gray-600">Price per unit</dt>
            <dd className="font-semibold text-kresla-dark">{formatSom(pricing.unitPrice)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Volume discount</dt>
            <dd className="text-emerald-600">-{pricing.extraDiscountPercent}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Total</dt>
            <dd className="font-bold text-kresla-primary">{formatSom(pricing.lineTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">You save</dt>
            <dd className="text-emerald-600">{formatSom(pricing.savings)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            onAddToCart?.({ product, quantity: qty, unitPrice: pricing.unitPrice })
            onClose()
          }}
          className="mt-6 w-full rounded-lg bg-kresla-dark py-3 text-sm font-semibold text-white hover:bg-kresla-primary transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
