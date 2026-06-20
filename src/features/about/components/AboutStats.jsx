import { Factory, Layers, Package, Shield } from 'lucide-react'
import { ABOUT_STATS } from '../data/aboutContent'

const ICONS = {
  shield: Shield,
  package: Package,
  layers: Layers,
  factory: Factory,
}

export default function AboutStats() {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-[Poppins] text-3xl font-semibold text-[#1a1a1a] sm:text-4xl">
            Built on measurable trust
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#6b6b6b]">
            Transparency in numbers—reflecting the scale, care, and accountability behind every order.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {ABOUT_STATS.map((stat, index) => {
            const Icon = ICONS[stat.icon]
            const isDark = index % 2 === 1

            return (
              <article
                key={stat.label}
                className={`flex flex-col rounded-2xl p-8 transition-transform hover:-translate-y-0.5 ${
                  isDark
                    ? 'bg-[#0b3c3c] text-white shadow-[0_20px_40px_-16px_rgba(11,60,60,0.45)]'
                    : 'border border-[#0b3c3c]/12 bg-white text-[#1a1a1a]'
                }`}
              >
                <Icon
                  className={`mb-6 h-8 w-8 ${isDark ? 'text-white/80' : 'text-[#0b3c3c]'}`}
                  strokeWidth={1.5}
                />
                <p
                  className={`font-[Poppins] text-3xl font-semibold tracking-tight sm:text-4xl ${
                    isDark ? 'text-white' : 'text-[#0b3c3c]'
                  }`}
                >
                  {stat.value}
                </p>
                <p
                  className={`mt-3 text-sm leading-snug ${
                    isDark ? 'text-white/75' : 'text-[#5c5c5c]'
                  }`}
                >
                  {stat.label}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
