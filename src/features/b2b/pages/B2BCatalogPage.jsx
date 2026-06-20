import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/features/auth/authApi'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import CatalogFilters from '../components/catalog/CatalogFilters'
import B2BProductCard from '../components/catalog/B2BProductCard'
import BulkPriceModal from '../components/catalog/BulkPriceModal'
import { useB2BCart } from '../hooks/useB2BCart'
import { calculateB2BLinePrice } from '../utils/pricing'

const NEW_DAYS = 60

export default function B2BCatalogPage() {
  const { addItem } = useB2BCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [bulkProduct, setBulkProduct] = useState(null)

  const loadFavorites = useCallback(async () => {
    try {
      const { data } = await b2bApi.getFavorites()
      setFavoriteIds(new Set((data.favorites || []).map((f) => String(f.productId))))
    } catch {
      /* optional */
    }
  }, [])

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => {})
    loadFavorites()
  }, [loadFavorites])

  useEffect(() => {
    setLoading(true)
    const params = {
      search: filters.search,
      category: filters.category,
      material: filters.material,
      color: filters.color,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock ? 'true' : undefined,
      b2bOnly: filters.b2bOnly ? 'true' : undefined,
      limit: 48,
    }
    b2bApi
      .getProducts(params)
      .then(({ data }) => {
        let list = data.products || []
        if (filters.newArrivals) {
          const cutoff = Date.now() - NEW_DAYS * 86400000
          list = list.filter((p) => p.createdAt && new Date(p.createdAt).getTime() >= cutoff)
        }
        setProducts(list)
      })
      .catch(() => toast.error('Failed to load catalog'))
      .finally(() => setLoading(false))
  }, [filters])

  const colorOptions = useMemo(() => {
    const set = new Set()
    products.forEach((p) => p.colors?.forEach((c) => set.add(c)))
    return [...set].slice(0, 12)
  }, [products])

  const addProductToCart = (product, qty = 1, unitPrice) => {
    const price =
      unitPrice ??
      calculateB2BLinePrice({
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        quantity: qty,
      }).unitPrice
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.mainImage,
      unitPrice: price,
      retailPrice: product.retailPrice,
      quantity: qty,
    })
    toast.success('Added to cart')
  }

  const toggleFavorite = async (productId) => {
    const id = String(productId)
    try {
      if (favoriteIds.has(id)) {
        await b2bApi.removeFavorite(productId)
        setFavoriteIds((s) => {
          const n = new Set(s)
          n.delete(id)
          return n
        })
      } else {
        await b2bApi.addFavorite(productId)
        setFavoriteIds((s) => new Set(s).add(id))
      }
    } catch {
      toast.error('Could not update favorites')
    }
  }

  const shareProduct = (product) => {
    const url = `${window.location.origin}/designer-portal/catalog/${product.id}`
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied')
    }
  }

  return (
    <B2BVerifiedGate>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-kresla-dark">B2B Product Catalog</h2>
        <p className="text-sm text-gray-600 mt-1">Wholesale pricing with volume discounts</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <CatalogFilters filters={filters} categories={categories} colorOptions={colorOptions} onChange={setFilters} />

        <div>
          {loading ? (
            <p className="text-gray-500 py-12 text-center">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">No products match your filters.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <B2BProductCard
                  key={p.id}
                  product={p}
                  isFavorite={favoriteIds.has(String(p.id))}
                  onToggleFavorite={toggleFavorite}
                  onBulkCalc={setBulkProduct}
                  onAddToCart={addProductToCart}
                  onShare={shareProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BulkPriceModal
        product={bulkProduct}
        open={!!bulkProduct}
        onClose={() => setBulkProduct(null)}
        onAddToCart={({ product, quantity, unitPrice }) => addProductToCart(product, quantity, unitPrice)}
      />
    </B2BVerifiedGate>
  )
}
