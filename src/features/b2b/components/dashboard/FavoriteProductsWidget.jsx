import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatSom } from '@/features/kresla/utils/formatPrice'

export default function FavoriteProductsWidget({ favorites = [], onAddToCart, onRemoveFavorite }) {
  return (
    <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-kresla-dark">Your Products</h3>
        <Link to="/designer-portal/catalog" className="text-sm font-semibold text-kresla-primary">
          Catalog →
        </Link>
      </div>
      {!favorites.length ? (
        <p className="text-sm text-gray-500">Save products from the catalog for quick reorder.</p>
      ) : (
        <ul className="space-y-3">
          {favorites.slice(0, 5).map((f) => (
            <li key={f.id} className="flex gap-3 items-center">
              {f.product?.mainImage ? (
                <img src={f.product.mainImage} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/designer-portal/catalog/${f.productId}`} className="text-sm font-medium text-kresla-dark truncate block hover:text-kresla-primary">
                  {f.product?.name}
                </Link>
                <p className="text-xs text-kresla-primary font-semibold">
                  {formatSom(f.product?.wholesalePrice || f.product?.unitPrice)}
                  {!f.product?.inStock && <span className="text-red-500 ml-2">Out of stock</span>}
                </p>
              </div>
              <button
                type="button"
                title="Add to cart"
                disabled={!f.product?.inStock}
                onClick={() => onAddToCart?.(f.product)}
                className="p-2 rounded-lg border border-[#0b3c3c]/20 hover:bg-kresla-dark hover:text-white transition disabled:opacity-40"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Remove favorite"
                onClick={() => onRemoveFavorite?.(f.productId)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
