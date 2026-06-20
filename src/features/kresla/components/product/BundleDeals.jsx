import { useMemo, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../../cart/cartSlice.js'
import { formatSom } from '../../utils/formatPrice'
import { getProductImageSource } from '../../../admin/utils/imageUrl'
import { useToast } from '../../context/ToastContext'

export default function BundleDeals({ product, related = [] }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const bundleKey = useMemo(
    () => related.slice(0, 2).map((r) => r.id).join(','),
    [related]
  )
  const bundleItems = useMemo(() => related.slice(0, 2), [bundleKey])
  const [checked, setChecked] = useState([])

  useEffect(() => {
    if (!bundleKey) return
    setChecked(bundleKey.split(',').filter(Boolean))
  }, [bundleKey])

  const items = useMemo(() => {
    const main = checked.includes(product.id) ? [product] : []
    const extras = bundleItems.filter((r) => checked.includes(r.id))
    return [...main, ...extras]
  }, [checked, product.id, product.price, bundleKey, bundleItems])

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0)
  const savings = Math.round(total * 0.15)

  const toggle = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const addAll = () => {
    items.forEach((item) => dispatch(addToCart({ ...item, quantity: 1 })))
    toast.success('Hammasi savatga qo\'shildi')
  }

  if (!bundleItems.length) return null

  return (
    <div className="mt-8 rounded-xl border border-kresla-primary/20 p-4 bg-kresla-light/30">
      <h3 className="font-semibold text-kresla-dark mb-4">Ko&apos;pincha birgalikda sotib olinadi</h3>
      <ul className="space-y-3 mb-4">
        {bundleItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="rounded border-kresla-primary text-kresla-primary"
            />
            <img
              src={getProductImageSource(item)}
              alt=""
              className="w-14 h-14 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title || item.name}</p>
              <p className="text-sm text-kresla-primary">{formatSom(item.price)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-kresla-primary font-medium mb-3">
        15% tejaysiz — {formatSom(savings)} iqtisod
      </p>
      <p className="text-sm mb-3">Jami: {formatSom(total - savings)}</p>
      <button
        type="button"
        onClick={addAll}
        className="w-full py-2.5 rounded-lg bg-kresla-primary text-white font-medium hover:bg-kresla-accent transition-colors"
      >
        Hammasini savatga qo&apos;shish
      </button>
    </div>
  )
}
