import { useCallback, useEffect, useRef, useState } from 'react'
import useFetch from '../hook/useFetch'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import { Download } from 'lucide-react'

const FLOOR_TYPES = [
  { id: 'wood', label: 'Yog\'och', color: '#c4a574' },
  { id: 'tile', label: 'Kafel', color: '#e8e4df' },
  { id: 'carpet', label: 'Gilam', color: '#8b7355' },
]

const DEFAULT_ITEMS = [
  { id: 'sofa', label: 'Divan', w: 120, h: 50, color: '#0F6E56' },
  { id: 'table', label: 'Stol', w: 70, h: 45, color: '#1D9E75' },
  { id: 'chair', label: 'Stul', w: 35, h: 35, color: '#2d4a4a' },
]

export default function Showroom() {
  usePageSEO({
    title: 'Virtual showroom — Kresla',
    description: 'Mebelni xonangizga joylashtiring — 2D virtual showroom.',
  })

  const canvasRef = useRef(null)
  const { state } = useFetch('products', { limit: 12 })
  const [wallColor, setWallColor] = useState('#f4f7f7')
  const [floor, setFloor] = useState(FLOOR_TYPES[0])
  const [placed, setPlaced] = useState([])
  const [drag, setDrag] = useState(null)

  const catalog = (state?.products ?? []).slice(0, 8).map((p, i) => ({
    id: String(p.id),
    label: (p.title || p.name || 'Mebel').slice(0, 12),
    w: 80 + (i % 3) * 20,
    h: 40 + (i % 2) * 15,
    color: ['#0F6E56', '#1D9E75', '#6B4E71'][i % 3],
    productId: p.id,
  }))

  const furnitureList = catalog.length ? catalog : DEFAULT_ITEMS

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = wallColor
    ctx.fillRect(0, 0, w, h * 0.65)
    ctx.fillStyle = floor.color
    ctx.fillRect(0, h * 0.65, w, h * 0.35)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.strokeRect(20, 20, w - 40, h - 40)
    placed.forEach((item) => {
      ctx.fillStyle = item.color
      ctx.fillRect(item.x, item.y, item.w, item.h)
      ctx.fillStyle = '#fff'
      ctx.font = '11px Poppins,sans-serif'
      ctx.fillText(item.label, item.x + 6, item.y + item.h / 2 + 4)
    })
  }, [wallColor, floor, placed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = Math.min(480, window.innerHeight * 0.55)
      draw()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const hitTest = (x, y) => {
    for (let i = placed.length - 1; i >= 0; i -= 1) {
      const it = placed[i]
      if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return i
    }
    return -1
  }

  const onCanvasDown = (e) => {
    const canvas = canvasRef.current
    const { x, y } = getPos(e, canvas)
    const idx = hitTest(x, y)
    if (idx >= 0) setDrag({ idx, offsetX: x - placed[idx].x, offsetY: y - placed[idx].y })
  }

  const onCanvasMove = (e) => {
    if (!drag) return
    const canvas = canvasRef.current
    const { x, y } = getPos(e, canvas)
    setPlaced((prev) => {
      const next = [...prev]
      next[drag.idx] = {
        ...next[drag.idx],
        x: x - drag.offsetX,
        y: y - drag.offsetY,
      }
      return next
    })
  }

  const onCanvasUp = () => setDrag(null)

  const addFurniture = (item) => {
    setPlaced((prev) => [
      ...prev,
      { ...item, x: 80 + prev.length * 24, y: 120 + prev.length * 16 },
    ])
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'kresla-showroom.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto max-w-[1360px] px-3">
        <h1 className="text-3xl font-semibold text-kresla-dark mb-2">Virtual showroom</h1>
        <p className="text-gray-600 mb-6">Mebelni xonangizga sudrab joylashtiring</p>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 space-y-4">
            <div>
              <label className="text-sm font-medium text-kresla-dark">Devor rangi</label>
              <input
                type="color"
                value={wallColor}
                onChange={(e) => setWallColor(e.target.value)}
                className="mt-1 h-10 w-full rounded border cursor-pointer"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-kresla-dark">Pol turi</label>
              <select
                value={floor.id}
                onChange={(e) => setFloor(FLOOR_TYPES.find((f) => f.id === e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              >
                {FLOOR_TYPES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-kresla-dark mb-2">Katalog</p>
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {furnitureList.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => addFurniture(item)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-kresla-primary text-sm"
                    >
                      + {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1">
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full touch-none cursor-move"
                onMouseDown={onCanvasDown}
                onMouseMove={onCanvasMove}
                onMouseUp={onCanvasUp}
                onMouseLeave={onCanvasUp}
                onTouchStart={onCanvasDown}
                onTouchMove={onCanvasMove}
                onTouchEnd={onCanvasUp}
              />
            </div>
            <button
              type="button"
              onClick={downloadPng}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-kresla-primary text-white hover:bg-kresla-accent"
            >
              <Download className="h-4 w-4" />
              PNG sifatida saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
