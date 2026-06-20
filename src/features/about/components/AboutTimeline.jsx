import { ABOUT_TIMELINE } from '../data/aboutContent'

export default function AboutTimeline() {
  return (
    <section className="bg-[#0b3c3c] py-20 text-white lg:py-28">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">How we work</p>
          <h2 className="mt-3 font-[Poppins] text-3xl font-semibold sm:text-4xl">
            A seamless journey from idea to installation
          </h2>
        </div>

        <div className="relative">
          <div
            className="absolute left-6 top-0 hidden h-full w-px border-l border-dashed border-white/25 lg:left-[12.5%] lg:block"
            aria-hidden
          />

          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-8">
            {ABOUT_TIMELINE.map((item, index) => (
              <li key={item.step} className="relative lg:pt-2">
                <div className="flex gap-5 lg:flex-col lg:gap-6">
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-[#0b3c3c] font-[Poppins] text-sm font-semibold text-white shadow-[0_0_0_8px_rgba(11,60,60,1)]">
                    {item.step}
                  </div>
                  <div>
                    {index < ABOUT_TIMELINE.length - 1 && (
                      <span
                        className="absolute left-6 top-12 hidden h-[calc(100%+3rem)] w-px border-l border-dashed border-white/20 lg:hidden"
                        aria-hidden
                      />
                    )}
                    <h3 className="font-[Poppins] text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{item.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
