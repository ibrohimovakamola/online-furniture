import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ABOUT_IMAGES } from '../data/aboutContent'

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b3c3c]/70">
              About Kresla
            </p>
            <h1 className="font-[Poppins] text-4xl font-semibold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-5xl lg:text-[3.25rem]">
              Crafting the Philosophy of Comfort for Your Home
            </h1>
            <p className="mt-6 text-base leading-relaxed text-[#4a4a4a] sm:text-lg">
              We believe exceptional furniture is quiet luxury—thoughtfully designed, honestly made,
              and delivered with care. Every piece reflects a commitment to material integrity,
              timeless form, and the rituals of everyday living.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#6b6b6b]">
              From consultation to assembly, we partner with you to create spaces that feel
              intentional, welcoming, and unmistakably yours.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0b3c3c] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#0d4a4a]"
            >
              Explore Collection
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-[#0b3c3c]/5 blur-2xl" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5f5f5] shadow-[0_24px_48px_-12px_rgba(11,60,60,0.18)] sm:aspect-[5/6] lg:aspect-[4/5]">
              <img
                src={ABOUT_IMAGES.hero}
                alt="Minimalist interior with premium furniture"
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-white/20 bg-[#0b3c3c] px-5 py-4 text-white shadow-lg sm:block">
              <p className="text-2xl font-semibold tabular-nums">Since 2018</p>
              <p className="text-xs uppercase tracking-wider text-white/70">Design-led furniture house</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
