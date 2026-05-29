import { Pencil, Trash2 } from 'lucide-react'
import ProductThumbnail from './ProductThumbnail'
import { getProductImageSource } from '../utils/imageUrl'

function formatPrice(product) {
  if (product.discountedPrice) {
    return (
      <span>
        <span className="text-[var(--admin-text)]">${product.discountedPrice}</span>
        <span className="text-[var(--admin-text-subtle)] line-through ml-2 text-xs">${product.basePrice}</span>
      </span>
    )
  }
  return `$${product.basePrice}`
}

function ProductTable({ products, onEdit, onDelete }) {
  if (!products.length) {
    return (
      <div className="py-16 text-center text-[var(--admin-text-muted)]">
        No products found. Add your first furniture item.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--admin-border)]">
            <th className="w-[72px] py-4 px-4 font-medium text-[var(--admin-text-muted)] text-left">Image</th>
            <th className="py-4 px-4 font-medium text-[var(--admin-text-muted)] text-left min-w-[140px]">Product Name</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden lg:table-cell">SKU</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden md:table-cell">Category</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)]">Price</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden sm:table-cell">Stock</th>
            <th className="w-[100px] text-right py-4 px-4 font-medium text-[var(--admin-text-muted)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const id = product.id || product._id
            const imageSrc = getProductImageSource(product)
            const color = product.filters?.color

            return (
              <tr
                key={id}
                className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors"
              >
                <td className="py-4 px-4 align-middle w-[72px]">
                  <ProductThumbnail src={imageSrc} alt={product.name} size="md" />
                </td>
                <td className="py-4 px-4 align-middle min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {color && (
                      <span
                        className="h-3 w-3 rounded-full shrink-0 ring-1 ring-white/20"
                        style={{ background: color }}
                        title={color}
                      />
                    )}
                    <span className="font-medium text-[var(--admin-text)] truncate">{product.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-[var(--admin-text-muted)] hidden lg:table-cell align-middle">{product.sku || '—'}</td>
                <td className="py-4 px-4 text-[var(--admin-text-muted)] hidden md:table-cell align-middle">{product.category?.name || '—'}</td>
                <td className="py-4 px-4 align-middle">{formatPrice(product)}</td>
                <td className="py-4 px-4 hidden sm:table-cell align-middle">
                  <span className={`admin-badge ${product.stock <= 5 ? 'admin-badge--pending' : 'admin-badge--success'}`}>
                    {product.stock <= 0 ? 'Out of stock' : `${product.stock} in stock`}
                  </span>
                </td>
                <td className="py-4 px-4 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--icon"
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--icon"
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProductTable
