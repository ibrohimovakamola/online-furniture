import { useState } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../hook/useFetch'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import { useCountdown, getFlashSaleEndDate } from '../features/kresla/hooks/useCountdown'
import { formatSom } from '../features/kresla/utils/formatPrice'
import { readJSON, writeJSON, STORAGE_KEYS } from '../features/kresla/utils/storage'
import { useToast } from '../features/kresla/context/ToastContext'
import { getProductImageSource } from '../features/admin/utils/imageUrl'
import LiveViewerBadge from '../features/kresla/components/LiveViewerBadge'

function discountPrice(price, pct) {
  const p = Number(price) || 0
  return Math.round(p * (1 - pct / 100))
}

export default function FlashSalePage() {
  const endDate = getFlashSaleEndDate()
  const countdown = useCountdown(endDate)
  const toast = useToast()
  const { state, loading } = useFetch('products', { limit: 20 })
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  usePageSEO({
    title: 'Flash Sale — Kresla',
    description: 'Chegirmali mebel aksiyasi — faqat cheklangan vaqt.',
  })

  const products = (state?.products ?? [])
    .filter((p) => p.discountPercentage > 0 || p.discountedPrice)
    .slice(0, 12)
    .map((p, i) => ({
      ...p,
      flashPct: 15 + (i % 3) * 5,
      stockLeft: 5,
    }))

  const handleEmail = (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('To\'g\'ri email kiriting')
      return
    }
    setEmailError('')
    const list = readJSON(STORAGE_KEYS.flashSaleEmails, [])
    if (!list.includes(email)) writeJSON(STORAGE_KEYS.flashSaleEmails, [...list, email])
    toast.success('Email qabul qilindi! Keyingi aksiyadan xabardor bo\'lasiz.')
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-medium">
        🔥 Flash Sale tugashiga: {countdown.formatted}
      </div>

      <section className="bg-gradient-to-br from-kresla-dark to-kresla-primary text-white py-12 md:py-16">
        <div className="container mx-auto max-w-[1360px] px-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Flash Sale</h1>
          <p className="mb-8 opacity-90">Chegirmalar tugashiga qolgan vaqt</p>
          <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
            {[
              ['Kun', countdown.days],
              ['Soat', countdown.hours],
              ['Daqiqa', countdown.minutes],
              ['Soniya', countdown.seconds],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/15 rounded-lg px-4 py-3 min-w-[72px]">
                <div className="text-2xl md:text-3xl font-bold tabular-nums">{String(val).padStart(2, '0')}</div>
                <div className="text-xs opacity-80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 container mx-auto max-w-[1360px] px-3">
        {loading ? (
          <p className="text-center text-gray-500">Yuklanmoqda...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const salePrice = discountPrice(p.price, p.flashPct)
              return (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={getProductImageSource(p)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      -{p.flashPct}%
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-2">{p.title || p.name}</h3>
                    <p className="text-kresla-primary font-semibold mt-1">{formatSom(salePrice)}</p>
                    <p className="text-xs text-red-600 font-medium mt-2">Faqat {p.stockLeft} ta qoldi!</p>
                    <LiveViewerBadge productId={p.id} className="mt-2" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="py-12 bg-kresla-light/40">
        <div className="container mx-auto max-w-md px-3 text-center">
          <h2 className="text-xl font-semibold text-kresla-dark mb-4">
            Keyingi aksiyadan birinchi xabardor bo&apos;ling
          </h2>
          <form onSubmit={handleEmail} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email manzilingiz"
              className="flex-1 border rounded-lg px-4 py-2.5"
            />
            <button type="submit" className="px-6 py-2.5 rounded-lg bg-kresla-primary text-white font-medium">
              Yuborish
            </button>
          </form>
          {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
        </div>
      </section>
    </div>
  )
}
