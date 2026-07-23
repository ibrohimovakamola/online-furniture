import { forwardRef, memo, useCallback, useState } from 'react'
import FurnitureLayer from './FurnitureLayer'
import { DEFAULT_FURNITURE_SIZE, SHOWROOM_PRODUCT_MIME } from '../constants'

const DEFAULT_ROOM_STYLE = {
  backgroundImage: [
    'linear-gradient(180deg, #e8ecec 0%, #e8ecec 62%, #c9b08a 62%, #b89a72 100%)',
    'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(11,60,60,0.04) 39px, rgba(11,60,60,0.04) 40px)',
  ].join(', '),
  backgroundSize: 'cover, 40px 100%',
}

/**
 * @param {{
 *   roomImageUrl: string | null,
 *   placed: import('../hooks/usePlacedFurniture').PlacedItem[],
 *   selectedId: string | null,
 *   onSelect: (id: string | null) => void,
 *   onUpdate: (id: string, patch: Record<string, unknown>) => void,
 *   onDelete: (id: string) => void,
 *   onAddFromCatalog: (item: { id: string, name: string, imageUrl: string }, position?: { x: number, y: number }) => void,
 * }} props
 */
function RoomCanvas(
  { roomImageUrl, placed, selectedId, onSelect, onUpdate, onDelete, onAddFromCatalog },
  ref
) {
  const [dragOver, setDragOver] = useState(false)

  const resolveDropPosition = useCallback((clientX, clientY, element) => {
    const rect = element?.getBoundingClientRect()
    if (!rect) return { x: 80, y: 80 }

    return {
      x: Math.max(0, clientX - rect.left - DEFAULT_FURNITURE_SIZE.width / 2),
      y: Math.max(0, clientY - rect.top - DEFAULT_FURNITURE_SIZE.height / 2),
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)

      const raw = e.dataTransfer.getData(SHOWROOM_PRODUCT_MIME)
      if (!raw) return

      try {
        const item = JSON.parse(raw)
        const position = resolveDropPosition(e.clientX, e.clientY, e.currentTarget)
        onAddFromCatalog(item, position)
      } catch {
        /* ignore malformed payload */
      }
    },
    [onAddFromCatalog, resolveDropPosition]
  )

  const backgroundStyle = roomImageUrl
    ? {
        backgroundImage: `url("${roomImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : DEFAULT_ROOM_STYLE

  return (
    <div
      ref={ref}
      data-showroom-canvas
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onMouseDown={() => onSelect(null)}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onSelect(null)
      }}
      className={[
        'relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100',
        'aspect-[4/3] min-h-[280px] sm:min-h-[360px] lg:min-h-[480px]',
        dragOver ? 'ring-2 ring-kresla-primary ring-offset-2' : '',
      ].join(' ')}
      style={backgroundStyle}
    >
      {!roomImageUrl ? (
        <div className="pointer-events-none absolute inset-x-0 top-[18%] px-6 text-center">
          <p className="text-sm font-medium text-kresla-dark/70">Standart xona</p>
          <p className="mt-1 text-xs text-kresla-dark/50">Yuqoridagi paneldan xona rasmini yuklang</p>
        </div>
      ) : null}

      {placed.map((item, index) => (
        <FurnitureLayer
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          zIndex={selectedId === item.id ? 30 : 10 + index}
          onSelect={onSelect}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default memo(forwardRef(RoomCanvas))
