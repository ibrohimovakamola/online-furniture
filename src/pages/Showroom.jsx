import { useEffect, useMemo, useRef, useState } from 'react'
import useFetch from '@/hook/useFetch'
import { usePageSEO } from '@/features/kresla/hooks/usePageSEO'
import { Download } from 'lucide-react'
import RoomUpload from '@/features/showroom/components/RoomUpload'
import CatalogGrid from '@/features/showroom/components/CatalogGrid'
import RoomCanvas from '@/features/showroom/components/RoomCanvas'
import { usePlacedFurniture } from '@/features/showroom/hooks/usePlacedFurniture'
import { mapProductsToCatalog } from '@/features/showroom/utils/catalog'
import { exportRoomAsPng } from '@/features/showroom/utils/exportRoom'

export default function Showroom() {
  usePageSEO({
    title: 'Virtual showroom — Kresla',
    description: 'Xonangiz suratiga mebelni joylashtiring — interaktiv 3D ko‘rinishli vizualizator.',
  })

  const canvasRef = useRef(null)
  const { state, loading } = useFetch('products', { limit: 24 })
  const [roomImageUrl, setRoomImageUrl] = useState(null)
  const [exporting, setExporting] = useState(false)

  const {
    placed,
    selectedId,
    addFromCatalog,
    updateItem,
    removeItem,
    selectItem,
  } = usePlacedFurniture()

  const catalogItems = useMemo(
    () => mapProductsToCatalog(state?.products ?? []),
    [state?.products]
  )

  useEffect(() => {
    return () => {
      if (roomImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(roomImageUrl)
      }
    }
  }, [roomImageUrl])

  const handleRoomImageChange = (url) => {
    setRoomImageUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
  }

  const downloadPng = async () => {
    if (!canvasRef.current || exporting) return
    setExporting(true)
    try {
      await exportRoomAsPng(canvasRef.current)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto max-w-[1360px] px-3">
        <h1 className="mb-2 text-3xl font-semibold text-kresla-dark">Virtual showroom</h1>
        <p className="mb-6 text-gray-600">Mebelni xonangizga sudrab joylashtiring</p>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full space-y-6 lg:w-72 xl:w-80">
            <RoomUpload roomImageUrl={roomImageUrl} onRoomImageChange={handleRoomImageChange} />

            <div>
              <p className="mb-2 text-sm font-medium text-kresla-dark">Katalog</p>
              <p className="mb-3 text-xs text-gray-500">
                Bosing yoki sudrab kanvasga tashlang
              </p>
              <CatalogGrid items={catalogItems} loading={loading} onAdd={addFromCatalog} />
            </div>

            {selectedId ? (
              <div className="rounded-xl border border-kresla-primary/20 bg-kresla-light/50 px-3 py-3 text-xs text-kresla-dark">
                Tanlangan mebelni kanvasda siljiting, burchakdan o‘lchamini o‘zgartiring yoki yuqoridagi
                tugmalar bilan aylantiring.
              </div>
            ) : null}
          </aside>

          <div className="flex-1">
            <RoomCanvas
              ref={canvasRef}
              roomImageUrl={roomImageUrl}
              placed={placed}
              selectedId={selectedId}
              onSelect={selectItem}
              onUpdate={updateItem}
              onDelete={removeItem}
              onAddFromCatalog={addFromCatalog}
            />

            <button
              type="button"
              onClick={downloadPng}
              disabled={exporting}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-kresla-dark px-5 py-2.5 text-white transition hover:bg-kresla-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden />
              {exporting ? 'Saqlanmoqda…' : 'PNG sifatida saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
