import { memo } from 'react'
import { Plus } from 'lucide-react'
import { SHOWROOM_PRODUCT_MIME } from '../constants'

/**
 * @param {{
 *   items: { id: string, name: string, imageUrl: string }[],
 *   loading?: boolean,
 *   onAdd: (item: { id: string, name: string, imageUrl: string }) => void,
 * }} props
 */
function CatalogGrid({ items, loading = false, onAdd }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500">
        Katalogda mebel topilmadi. Admin paneldan mahsulot qo&apos;shing.
      </p>
    )
  }

  return (
    <div className="grid max-h-[min(420px,50vh)] grid-cols-2 gap-2 overflow-y-auto pr-1">
      {items.map((item) => (
        <article
          key={item.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(SHOWROOM_PRODUCT_MIME, JSON.stringify(item))
            e.dataTransfer.effectAllowed = 'copy'
          }}
          className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-kresla-primary hover:shadow-sm"
        >
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="flex w-full flex-col text-left"
          >
            <div className="relative aspect-[4/3] bg-kresla-light/50 p-2">
              <img
                src={item.imageUrl}
                alt={item.name}
                crossOrigin="anonymous"
                draggable={false}
                className="h-full w-full object-contain"
                loading="lazy"
              />
              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-kresla-dark text-white opacity-0 transition group-hover:opacity-100">
                <Plus className="h-4 w-4" aria-hidden />
              </span>
            </div>
            <p className="line-clamp-2 px-2 py-2 text-xs font-medium text-kresla-dark">{item.name}</p>
          </button>
        </article>
      ))}
    </div>
  )
}

export default memo(CatalogGrid)
