import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import BreadCrumbs from '../../components/BreadCrumbs'
import { usePageSEO } from '../kresla/hooks/usePageSEO'
import { fetchGalleryItems } from '@/services/galleryApi'
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from './constants'
import GalleryCard from './components/GalleryCard'
import GallerySubmitModal from './components/GallerySubmitModal'

export default function GalleryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchGalleryItems({ category: category || undefined, signal: controller.signal })
      .then((list) => setItems(list))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load gallery')
          setItems([])
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [category])

  usePageSEO({
    title: 'Interyer galereyasi — Exclusive',
    description: "Mehmonxona, yotoqxona va ofis loyihalarimizdan ilhom oling.",
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-6">
          <BreadCrumbs />
        </div>

        <header className="mb-10 max-w-2xl md:mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b3c3c]/70">
            Galereya
          </p>
          <h1 className="font-[Poppins] text-4xl font-bold tracking-tight text-[#1a1a1a] sm:text-5xl">
            Interyer ilhomlari
          </h1>
          <p className="mt-4 text-base text-[#6b6b6b] sm:text-lg">
            Haqiqiy loyihalarimizdan suratlar va dizayn g&apos;oyalari.
          </p>
        </header>

        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === ''
                ? 'bg-[#0b3c3c] text-white'
                : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#ebebeb]'
            }`}
          >
            Barchasi
          </button>
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-[#0b3c3c] text-white'
                  : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#ebebeb]'
              }`}
            >
              {GALLERY_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-20 text-center text-[#6b6b6b]">Yuklanmoqda…</p>
        ) : error ? (
          <p className="py-20 text-center text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-20 text-center text-[#6b6b6b]">Hozircha suratlar yo&apos;q.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            {items.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <section className="my-16 rounded-2xl border border-[#0b3c3c]/10 bg-[#fafafa] px-6 py-12 text-center sm:my-20 sm:px-10">
          <Camera className="mx-auto h-10 w-10 text-[#0b3c3c]/80" strokeWidth={1.5} />
          <h2 className="mt-4 font-[Poppins] text-xl font-semibold text-[#1a1a1a] sm:text-2xl">
            Sizning transformingiz keyingi bo&apos;lishi mumkin
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6b6b6b]">
            Xonangiz suratlarini yuboring — jamoamiz ko&apos;rib chiqadi.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#0b3c3c] px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#0d4a4a]"
          >
            O&apos;z xonangizni yuboring
          </button>
        </section>
      </div>

      <GallerySubmitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
