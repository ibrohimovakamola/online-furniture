import { Link } from 'react-router-dom'
import { Play, Star } from 'lucide-react'
import { VIDEO_TESTIMONIALS } from '../../data/testimonials'

export default function VideoTestimonials() {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto max-w-[1360px] px-3">
        <h2 className="text-2xl md:text-3xl font-semibold text-kresla-dark mb-2">Mijozlar fikri</h2>
        <p className="text-gray-600 mb-8">Haqiqiy xaridorlar tajribasi</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VIDEO_TESTIMONIALS.map((t) => (
            <article key={t.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="relative aspect-video rounded-lg bg-gray-200 flex items-center justify-center mb-4">
                <Play className="h-12 w-12 text-kresla-primary opacity-80" fill="currentColor" />
              </div>
              <div className="flex items-center gap-1 text-amber-400 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? 'fill-current' : 'fill-transparent'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-medium text-kresla-dark">{t.name}</p>
              <p className="text-xs text-gray-500">{t.city}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/reviews"
            className="inline-flex px-6 py-3 rounded-lg border border-kresla-primary text-kresla-primary font-medium hover:bg-kresla-primary hover:text-white transition-colors"
          >
            Ko&apos;proq sharh ko&apos;rish
          </Link>
        </div>
      </div>
    </section>
  )
}
