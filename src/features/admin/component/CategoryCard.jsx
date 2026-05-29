import { Pencil, Trash2 } from 'lucide-react'

function CategoryCard({ name, productCount, image = null }) {
  return (
    <div className="admin-card overflow-hidden group hover:-translate-y-0.5 transition-transform duration-200">
      <div className="admin-image-slot h-40 w-full rounded-none border-0 border-b border-[var(--admin-border)] text-sm">
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <span className="text-[var(--admin-text-subtle)]">Category image</span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[var(--admin-text)]">{name}</h3>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">
              {productCount} products
            </p>
          </div>
          <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--icon"
              aria-label={`Edit ${name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger admin-btn--icon"
              aria-label={`Delete ${name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard
