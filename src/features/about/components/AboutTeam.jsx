import { Link2 } from 'lucide-react'
import { ABOUT_TEAM } from '../data/aboutContent'

export default function AboutTeam() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0b3c3c]/70">
            Our people
          </p>
          <h2 className="mt-3 font-[Poppins] text-3xl font-semibold text-[#1a1a1a] sm:text-4xl">
            The Minds Behind the Craft
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#6b6b6b]">
            Designers, artisans, and project leaders united by a shared standard of excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_TEAM.map((member) => (
            <article
              key={member.name}
              className="group overflow-hidden rounded-2xl border border-[#0b3c3c]/8 bg-[#fafafa] transition-all duration-300 hover:-translate-y-1 hover:border-[#0b3c3c]/20 hover:shadow-[0_20px_40px_-20px_rgba(11,60,60,0.25)]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[#e8ecec]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3 className="font-[Poppins] text-base font-semibold text-[#1a1a1a]">{member.name}</h3>
                <p className="mt-1 text-sm text-[#0b3c3c]">{member.role}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] transition-colors group-hover:text-[#0b3c3c]"
                  aria-label={`${member.name} on LinkedIn`}
                >
                  <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Connect
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
