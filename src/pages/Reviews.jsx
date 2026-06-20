import { VIDEO_TESTIMONIALS } from '../features/kresla/data/testimonials'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import { Star } from 'lucide-react'

export default function Reviews() {
  usePageSEO({
    title: 'Mijozlar sharhlari — Kresla',
    description: 'Kresla xaridorlarining haqiqiy fikrlari va videolar.',
  })

  return (
    <div className="py-10 md:py-14">
      <div className="container mx-auto max-w-[1360px] px-3">
        <h1 className="text-3xl font-semibold text-kresla-dark mb-8">Barcha sharhlar</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VIDEO_TESTIMONIALS.map((t) => (
            <article key={t.id} className="p-6 rounded-xl border bg-white">
              <div className="flex gap-1 text-amber-400 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-current' : ''}`} />
                ))}
              </div>
              <p className="text-gray-700 mb-4">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-gray-500">{t.city}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
