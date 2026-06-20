import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Interactive before/after image comparison slider.
 * Supports images or solid-color placeholders for mock data.
 */
export default function BeforeAfterCompare({
  beforeImage,
  afterImage,
  beforeColor = '#8b9da8',
  afterColor = '#0b3c3c',
  beforeLabel = 'Oldin',
  afterLabel = 'Keyin',
  className = '',
  initialPosition = 50,
}) {
  const [position, setPosition] = useState(initialPosition)
  const containerRef = useRef(null)
  const draggingRef = useRef(false)

  const updateFromClientX = useCallback((clientX) => {
    const el = containerRef.current
    if (!el || clientX == null) return
    const { left, width } = el.getBoundingClientRect()
    if (width <= 0) return
    const pct = ((clientX - left) / width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }, [])

  const endDrag = useCallback(() => {
    draggingRef.current = false
  }, [])

  const onPointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return
      updateFromClientX(e.clientX)
    },
    [updateFromClientX]
  )

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [onPointerMove, endDrag])

  const startDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = true
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
    updateFromClientX(e.clientX)
  }

  const onContainerClick = (e) => {
    if (e.target.closest('[data-compare-handle]')) return
    updateFromClientX(e.clientX)
  }

  const renderLayer = (src, color, alt) => {
    if (src) {
      return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
    }
    return <div className="absolute inset-0" style={{ backgroundColor: color }} aria-hidden />
  }

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#e8ecec] select-none touch-none ${className}`}
      onPointerDown={onContainerClick}
      role="group"
      aria-label={`${beforeLabel} va ${afterLabel} taqqoslash`}
    >
      {/* After (full bleed, bottom layer) */}
      <div className="absolute inset-0">
        {renderLayer(afterImage, afterColor, afterLabel)}
      </div>

      {/* Before (clipped from left) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {renderLayer(beforeImage, beforeColor, beforeLabel)}
      </div>

      {/* Badges */}
      <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-[#0b3c3c]/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider + handle */}
      <div
        className="absolute top-0 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]"
        style={{ left: `${position}%` }}
        aria-hidden
      />
      <button
        type="button"
        data-compare-handle
        className="absolute top-1/2 z-40 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-[#0b3c3c] text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3c3c] focus-visible:ring-offset-2"
        style={{ left: `${position}%` }}
        onPointerDown={startDrag}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-label={`${beforeLabel} va ${afterLabel} chegarasini siljiting`}
      >
        <span aria-hidden>↔</span>
      </button>
    </div>
  )
}
