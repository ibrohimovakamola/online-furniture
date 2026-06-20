import { Link } from 'react-router-dom'
import { formatSom } from '@/features/kresla/utils/formatPrice'
import { Heart, Share2, Calculator, Box } from 'lucide-react'
import { calculateB2BLinePrice } from '../../utils/pricing'

function stockLabel(product) {
  if (!product.inStock) return { text: 'Out of Stock', className: 'text-red-600' }
  if (product.stock <= 5) return { text: 'Limited', className: 'text-amber-600' }
  return { text: 'In Stock', className: 'text-emerald-600' }
}

export default function B2BProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onBulkCalc,
  onAddToCart,
  onShare,
}) {
  const pricing = calculateB2BLinePrice({
    retailPrice: product.retailPrice,
    wholesalePrice: product.wholesalePrice,
    quantity: 1,
  })
  const stock = stockLabel(product)

  return (
    <article className="rounded-xl border border-[#0b3c3c]/10 bg-white overflow-hidden flex flex-col hover:shadow-md transition">
      <Link to={`/designer-portal/catalog/${product.id}`} className="block aspect-[4/3] bg-gray-100 relative">
        {product.mainImage ? (
          <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Box className="w-10 h-10" />
          </div>
        )}
        {product.model3dUrl && (
          <span className="absolute top-2 left-2 rounded bg-kresla-dark/80 text-white text-[10px] font-bold px-2 py-0.5">
            3D
          </span>
        )}
        {product.b2bOnly && (
          <span className="absolute top-2 right-2 rounded bg-kresla-primary text-white text-[10px] font-bold px-2 py-0.5">
            B2B Exclusive
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/designer-portal/catalog/${product.id}`}>
          <h3 className="font-semibold text-kresla-dark line-clamp-2 hover:text-kresla-primary">{product.name}</h3>
        </Link>
        {product.sku && <p className="text-xs text-gray-500 mt-0.5">{product.sku}</p>}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-gray-400 line-through">{formatSom(product.retailPrice)}</span>
          <span className="text-lg font-bold text-kresla-primary">{formatSom(pricing.unitPrice)}</span>
        </div>

        {product.colors?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {product.colors.slice(0, 5).map((c) => (
              <span key={c} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        )}

        <p className={`mt-2 text-xs font-semibold ${stock.className}`}>{stock.text}</p>

        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => onAddToCart?.(product, 1, pricing.unitPrice)}
            className="flex-1 min-w-[100px] rounded-lg bg-kresla-dark py-2 text-xs font-semibold text-white hover:bg-kresla-primary transition disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button type="button" onClick={() => onBulkCalc?.(product)} className="p-2 rounded-lg border border-[#0b3c3c]/20 hover:bg-gray-50" title="Bulk calculator">
            <Calculator className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite?.(product.id)}
            className={`p-2 rounded-lg border ${isFavorite ? 'border-red-200 text-red-500 bg-red-50' : 'border-[#0b3c3c]/20'}`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button type="button" onClick={() => onShare?.(product)} className="p-2 rounded-lg border border-[#0b3c3c]/20 hover:bg-gray-50" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
