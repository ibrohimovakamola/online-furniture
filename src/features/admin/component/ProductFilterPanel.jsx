import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { EMPTY_PRODUCT_FILTERS } from '../context/AdminSearchContext'

function ProductFilterPanel({ open, onClose, categories = [], appliedFilters, onApply }) {
  const panelRef = useRef(null)
  const [draft, setDraft] = useState(appliedFilters)

  useEffect(() => {
    if (open) setDraft(appliedFilters)
  }, [open, appliedFilters])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setDraft(EMPTY_PRODUCT_FILTERS)
    onApply(EMPTY_PRODUCT_FILTERS)
    onClose()
  }

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const hasActiveFilters =
    draft.category ||
    draft.stockStatus !== 'all' ||
    draft.minPrice !== '' ||
    draft.maxPrice !== ''

  return (
    <div ref={panelRef} className="product-filter-panel">
      <div className="product-filter-panel__header">
        <h3 className="product-filter-panel__title">Filter Products</h3>
        <button
          type="button"
          className="admin-btn admin-btn--ghost admin-btn--icon"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="product-filter-panel__body">
        <label className="product-filter-panel__field">
          <span className="product-filter-panel__label">Category</span>
          <select
            className="product-filter-panel__select"
            value={draft.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="product-filter-panel__field">
          <legend className="product-filter-panel__label">Stock Status</legend>
          <div className="product-filter-panel__stock-group">
            {[
              { value: 'all', label: 'All' },
              { value: 'inStock', label: 'In Stock' },
              { value: 'outOfStock', label: 'Out of Stock' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`product-filter-panel__stock-btn ${
                  draft.stockStatus === opt.value ? 'product-filter-panel__stock-btn--active' : ''
                }`}
                onClick={() => handleChange('stockStatus', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="product-filter-panel__price-row">
          <label className="product-filter-panel__field">
            <span className="product-filter-panel__label">Min Price ($)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="product-filter-panel__input"
              placeholder="0"
              value={draft.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
            />
          </label>
          <label className="product-filter-panel__field">
            <span className="product-filter-panel__label">Max Price ($)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="product-filter-panel__input"
              placeholder="Any"
              value={draft.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="product-filter-panel__footer">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={handleClear}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
        <button type="button" className="admin-btn admin-btn--primary" onClick={handleApply}>
          Apply Filters
        </button>
      </div>
    </div>
  )
}

export default ProductFilterPanel
