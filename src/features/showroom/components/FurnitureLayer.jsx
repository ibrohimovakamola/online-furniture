import { memo, useCallback } from 'react'
import { Rnd } from 'react-rnd'
import { RotateCcw, RotateCw, Trash2 } from 'lucide-react'

/**
 * @param {{
 *   item: {
 *     id: string,
 *     name: string,
 *     imageUrl: string,
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number,
 *     rotation: number,
 *   },
 *   isSelected: boolean,
 *   zIndex: number,
 *   onSelect: (id: string) => void,
 *   onUpdate: (id: string, patch: Record<string, unknown>) => void,
 *   onDelete: (id: string) => void,
 * }} props
 */
function FurnitureLayer({ item, isSelected, zIndex, onSelect, onUpdate, onDelete }) {
  const handleDragStop = useCallback(
    (_e, data) => {
      onUpdate(item.id, { x: data.x, y: data.y })
    },
    [item.id, onUpdate]
  )

  const handleResizeStop = useCallback(
    (_e, _dir, ref, _delta, position) => {
      onUpdate(item.id, {
        width: Math.max(48, parseInt(ref.style.width, 10)),
        height: Math.max(48, parseInt(ref.style.height, 10)),
        x: position.x,
        y: position.y,
      })
    },
    [item.id, onUpdate]
  )

  const rotateBy = useCallback(
    (delta) => {
      onUpdate(item.id, { rotation: item.rotation + delta })
    },
    [item.id, item.rotation, onUpdate]
  )

  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      bounds="parent"
      minWidth={48}
      minHeight={48}
      onDragStart={() => onSelect(item.id)}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={(e) => {
        e.stopPropagation()
        onSelect(item.id)
      }}
      onTouchStart={(e) => {
        e.stopPropagation()
        onSelect(item.id)
      }}
      enableResizing={isSelected}
      disableDragging={false}
      style={{ zIndex }}
      className={isSelected ? 'ring-2 ring-kresla-primary/80 ring-offset-1' : ''}
      resizeHandleClasses={{
        top: 'showroom-resize-handle',
        right: 'showroom-resize-handle',
        bottom: 'showroom-resize-handle',
        left: 'showroom-resize-handle',
        topRight: 'showroom-resize-handle showroom-resize-corner',
        bottomRight: 'showroom-resize-handle showroom-resize-corner',
        bottomLeft: 'showroom-resize-handle showroom-resize-corner',
        topLeft: 'showroom-resize-handle showroom-resize-corner',
      }}
    >
      <div
        className="relative h-full w-full select-none"
        style={{ transform: `rotate(${item.rotation}deg)`, transformOrigin: 'center center' }}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          crossOrigin="anonymous"
          draggable={false}
          className="pointer-events-none h-full w-full object-contain drop-shadow-md"
        />

        {isSelected ? (
          <div
            data-export-hide
            className="absolute -top-11 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-md"
          >
            <button
              type="button"
              aria-label="Chapga burish"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                rotateBy(-15)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-kresla-dark hover:bg-kresla-light"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="O&apos;ngga burish"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                rotateBy(15)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-kresla-dark hover:bg-kresla-light"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="O&apos;chirish"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </Rnd>
  )
}

export default memo(FurnitureLayer)
