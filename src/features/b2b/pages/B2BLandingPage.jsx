import { Link } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { usePageSEO } from '@/features/kresla/hooks/usePageSEO'
import { B2B_BENEFITS, B2B_CASE_STUDIES, B2B_FAQ } from '../data/b2bContent'

export default function B2BLandingPage() {
  usePageSEO({
    title: 'B2B Designer Portal — Exclusive Furniture',
    description: 'Wholesale pricing, credit terms, and dedicated support for interior designers and businesses.',
  })

  return (
    <div className="py-10 md:py-14">
      <div className="container mx-auto max-w-[1360px] px-3">
        <section className="grid lg:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-kresla-primary mb-3">B2B Partnership</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-kresla-dark leading-tight">
              Professional portal for designers & businesses
            </h1>
            <p className="mt-4 text-gray-600 text-lg max-w-xl">
              Access wholesale pricing, volume discounts, credit terms, and a dedicated account manager — exclusively
              for verified B2B partners.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/designer-portal/register"
                className="inline-flex items-center gap-2 rounded-lg bg-kresla-dark px-6 py-3 text-sm font-semibold text-white hover:bg-kresla-primary transition"
              >
                Apply for B2B Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/designer-portal/login"
                className="inline-flex items-center gap-2 rounded-lg border border-[#0b3c3c]/30 px-6 py-3 text-sm font-medium text-kresla-dark hover:bg-kresla-dark hover:text-white transition"
              >
                Partner Login
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-kresla-dark to-kresla-primary p-8 text-white">
            <Building2 className="w-10 h-10 mb-4 opacity-90" />
            <p className="text-2xl font-semibold">Trusted by 200+ businesses</p>
            <p className="mt-2 text-white/80">Hotels · Design studios · Retail chains · Developers</p>
            <ul className="mt-6 space-y-2">
              {B2B_BENEFITS.slice(0, 4).map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {B2B_CASE_STUDIES.map((c) => (
              <article key={c.client} className="rounded-xl border border-[#0b3c3c]/10 bg-white p-6">
                <div className="w-12 h-12 rounded-lg bg-kresla-primary/10 flex items-center justify-center font-bold text-kresla-primary mb-4">
                  {c.logo}
                </div>
                <h3 className="font-semibold text-kresla-dark">{c.client}</h3>
                <p className="text-sm text-gray-600 mt-2">{c.headline}</p>
                <p className="mt-3 text-sm font-semibold text-kresla-primary">{c.metric}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-kresla-dark mb-6">B2B FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {B2B_FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-[#0b3c3c]/10 bg-white p-5">
                <h3 className="font-medium text-kresla-dark">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
