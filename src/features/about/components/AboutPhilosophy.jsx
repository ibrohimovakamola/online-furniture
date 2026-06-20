import { Sparkles } from 'lucide-react'
import { ABOUT_IMAGES, MATERIAL_POINTS } from '../data/aboutContent'

export default function AboutPhilosophy() {
  return (
    <section className="bg-[#fafafa] py-20 lg:py-28">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[#0b3c3c]">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Brand Philosophy</span>
          </div>
          <h2 className="font-[Poppins] text-3xl font-semibold text-[#1a1a1a] sm:text-4xl">
            Materials that earn their place in your home
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="space-y-8">
            <p className="text-base leading-relaxed text-[#4a4a4a]">
              Luxury, for us, is not ornament—it is confidence in what you cannot see. We source
              fabrics, foams, and structural components with the same scrutiny we apply to silhouette
              and proportion, so every sofa, bed, and cabinet performs as beautifully as it appears.
            </p>
            <ul className="grid gap-6 sm:grid-cols-2">
              {MATERIAL_POINTS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-[#0b3c3c]/10 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-[Poppins] text-sm font-semibold text-[#0b3c3c]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5c5c5c]">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-[#e8ecec]">
            <div className="aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
              <img
                src={ABOUT_IMAGES.workshop}
                alt="Furniture production workshop"
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3c3c]/50 via-transparent to-transparent opacity-80" />
            <p className="absolute bottom-6 left-6 right-6 font-[Poppins] text-lg font-medium text-white">
              Where craftsmanship meets precision engineering
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
