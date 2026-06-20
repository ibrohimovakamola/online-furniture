import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import BulkPriceModal from '../components/catalog/BulkPriceModal'
import { useB2BCart } from '../hooks/useB2BCart'
import { formatSom } from '@/features/kresla/utils/formatPrice'
import { calculateB2BLinePrice } from '../utils/pricing'

export default function B2BProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useB2BCart()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    b2bApi
      .getProduct(id)
      .then(({ data }) => setProduct(data.product))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <B2BVerifiedGate><p className="text-gray-500">Loading…</p></B2BVerifiedGate>
  if (!product) return <B2BVerifiedGate><p>Product not found.</p></B2BVerifiedGate>

  const pricing = calculateB2BLinePrice({
    retailPrice: product.retailPrice,
    wholesalePrice: product.wholesalePrice,
    quantity: qty,
  })
  const moq = product.bulkPackSize || 5

  const addToCart = (quantity, unitPrice) => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.mainImage,
      unitPrice: unitPrice ?? pricing.unitPrice,
      retailPrice: product.retailPrice,
      quantity,
    })
    toast.success('Added to cart')
  }

  return (
    <B2BVerifiedGate>
      <Link to="/designer-portal/catalog" className="text-sm text-kresla-primary font-medium mb-4 inline-block">
        ← Back to catalog
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          {product.mainImage && (
            <img src={product.mainImage} alt={product.name} className="w-full rounded-xl border border-[#0b3c3c]/10" />
          )}
          {product.gallery?.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {product.gallery.map((g) => (
                <img key={g} src={g} alt="" className="w-20 h-20 rounded-lg object-cover border" />
              ))}
            </div>
          )}
          {product.model3dUrl && (
            <div className="mt-4 rounded-xl border border-[#0b3c3c]/10 p-4 bg-[#f4f7f7]">
              <p className="text-sm font-semibold text-kresla-dark mb-2">3D Model Viewer</p>
              <a href={product.model3dUrl} target="_blank" rel="noreferrer" className="text-sm text-kresla-primary underline">
                Open interactive 3D view →
              </a>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-kresla-dark">{product.name}</h1>
          {product.sku && <p className="text-sm text-gray-500 mt-1">Code: {product.sku}</p>}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-lg text-gray-400 line-through">{formatSom(product.retailPrice)}</span>
            <span className="text-2xl font-bold text-kresla-primary">{formatSom(pricing.unitPrice)}</span>
            <span className="text-sm text-emerald-600">Save {formatSom(pricing.savings)}</span>
          </div>

          <p className="mt-4 text-sm text-gray-600">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">MOQ</dt><dd className="font-medium">{moq} units</dd></div>
            <div><dt className="text-gray-500">Lead time</dt><dd className="font-medium">{product.inStock ? '3–5 days' : '14–21 days'}</dd></div>
            <div><dt className="text-gray-500">Stock</dt><dd className="font-medium">{product.stock} units</dd></div>
            {product.dimensions && (
              <div>
                <dt className="text-gray-500">Dimensions</dt>
                <dd className="font-medium">
                  {[product.dimensions.width, product.dimensions.height, product.dimensions.depth].filter(Boolean).join(' × ')} {product.dimensions.unit}
                </dd>
              </div>
            )}
          </dl>

          {product.technicalSpecs && (
            <div className="mt-4 rounded-lg bg-[#f4f7f7] p-4 text-sm whitespace-pre-wrap">{product.technicalSpecs}</div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => addToCart(qty)}
              className="rounded-lg bg-kresla-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-kresla-primary disabled:opacity-40"
            >
              Add to Cart
            </button>
            <button type="button" onClick={() => setBulkOpen(true)} className="rounded-lg border border-[#0b3c3c]/30 px-4 py-2.5 text-sm font-medium">
              Bulk calculator
            </button>
            <button
              type="button"
              onClick={async () => {
                await b2bApi.addFavorite(product.id)
                toast.success('Saved to favorites')
              }}
              className="rounded-lg border border-[#0b3c3c]/30 px-4 py-2.5 text-sm font-medium"
            >
              Add to Favorites
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">Line total for {qty} units: <strong>{formatSom(pricing.lineTotal)}</strong></p>
        </div>
      </div>

      <BulkPriceModal
        product={product}
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onAddToCart={({ quantity, unitPrice }) => addToCart(quantity, unitPrice)}
      />
    </B2BVerifiedGate>
  )
}
