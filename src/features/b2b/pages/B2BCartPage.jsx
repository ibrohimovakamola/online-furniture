import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import { useB2BCart } from '../hooks/useB2BCart'
import { formatSom } from '@/features/kresla/utils/formatPrice'

const SHIPPING_FLAT = 150_000

export default function B2BCartPage() {
  const { items, updateQty, removeItem, subtotal } = useB2BCart()
  const shipping = items.length ? SHIPPING_FLAT : 0
  const total = subtotal + shipping

  return (
    <B2BVerifiedGate>
      <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Shopping Cart</h2>

      {!items.length ? (
        <div className="text-center py-16 rounded-xl bg-white border border-[#0b3c3c]/10">
          <p className="text-gray-600">Your cart is empty.</p>
          <Link to="/designer-portal/catalog" className="inline-block mt-4 text-kresla-primary font-semibold">
            Browse catalog →
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.color || ''}`} className="flex gap-4 rounded-xl bg-white border border-[#0b3c3c]/10 p-4">
                {item.image && <img src={item.image} alt="" className="w-20 h-20 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-kresla-dark">{item.name}</p>
                  {item.sku && <p className="text-xs text-gray-500">{item.sku}</p>}
                  <p className="text-sm text-kresla-primary mt-1">{formatSom(item.unitPrice)} / unit</p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.productId, e.target.value, item.color)}
                      className="w-16 rounded border px-2 py-1 text-sm"
                    />
                    <button type="button" onClick={() => removeItem(item.productId, item.color)} className="text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-kresla-dark">{formatSom(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-6 h-fit">
            <h3 className="font-semibold text-kresla-dark mb-4">Order Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatSom(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping (est.)</dt><dd>{formatSom(shipping)}</dd></div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <dt>Grand Total</dt><dd className="text-kresla-primary">{formatSom(total)}</dd>
              </div>
            </dl>
            <Link
              to="/designer-portal/checkout"
              className="mt-6 block w-full text-center rounded-lg bg-kresla-dark py-3 text-sm font-semibold text-white hover:bg-kresla-primary transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </B2BVerifiedGate>
  )
}
