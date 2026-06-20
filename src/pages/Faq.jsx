import { useEffect, useMemo, useState } from 'react'
import { SOFA_SIZE_TABLE, COLOR_SWATCHES } from '../features/kresla/data/faqBuyingGuide'
import { FAQ_CATEGORY_LABELS, FAQ_CATEGORY_OPTIONS } from '../constants/faqCategories'
import { faqApi } from '../services/faqApi'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'

export default function Faq() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  usePageSEO({
    title: 'FAQ va xarid qo\'llanmasi — Kresla',
    description: 'Yetkazib berish, to\'lov, kafolat va mebel tanlash bo\'yicha savollar.',
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await faqApi.list()
        if (!cancelled) setFaqs(data.faqs || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'FAQ yuklanmadi')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? faqs.filter(
          (item) =>
            item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        )
      : faqs

    return FAQ_CATEGORY_OPTIONS.map((cat) => ({
      id: cat.id,
      title: cat.title,
      questions: filtered
        .filter((item) => item.category === cat.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    })).filter((cat) => cat.questions.length > 0)
  }, [faqs, query])

  return (
    <div className="py-10 md:py-14">
      <div className="container mx-auto max-w-[900px] px-3">
        <h1 className="text-3xl font-semibold text-kresla-dark mb-6">FAQ va xarid qo&apos;llanmasi</h1>

        <input
          type="search"
          placeholder="Savol qidiring..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mb-10"
        />

        {loading && <p className="text-gray-600 mb-8">Yuklanmoqda…</p>}
        {error && <p className="text-red-600 mb-8">{error}</p>}

        {!loading && !error && grouped.length === 0 && (
          <p className="text-gray-600 mb-8">Hozircha savollar mavjud emas.</p>
        )}

        {grouped.map((cat) => (
          <section key={cat.id} className="mb-8">
            <h2 className="text-xl font-semibold text-kresla-primary mb-4">
              {FAQ_CATEGORY_LABELS[cat.id] || cat.title}
            </h2>
            <ul className="space-y-2">
              {cat.questions.map((item) => {
                const id = item.id
                const open = openId === id
                return (
                  <li key={id} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : id)}
                      className="w-full text-left px-4 py-3 font-medium text-kresla-dark hover:bg-gray-50 flex justify-between"
                    >
                      {item.question}
                      <span>{open ? '−' : '+'}</span>
                    </button>
                    {open && <p className="px-4 pb-4 text-gray-600 text-sm whitespace-pre-line">{item.answer}</p>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        <hr className="my-12 border-gray-200" />

        <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Xarid qo&apos;llanmasi</h2>

        <h3 className="font-semibold mb-3">Qaysi hajmdagi divan tanlash kerak?</h3>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm border rounded-lg">
            <thead className="bg-kresla-primary text-white">
              <tr>
                <th className="p-3 text-left">Xona</th>
                <th className="p-3">O&apos;lcham</th>
                <th className="p-3">Model</th>
              </tr>
            </thead>
            <tbody>
              {SOFA_SIZE_TABLE.map((row) => (
                <tr key={row.room} className="border-t">
                  <td className="p-3">{row.room}</td>
                  <td className="p-3">{row.size}</td>
                  <td className="p-3">{row.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold mb-3">Mato vs charm</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="p-4 rounded-xl border border-kresla-primary/30 bg-kresla-light/50">
            <h4 className="font-semibold text-kresla-primary mb-2">Mato</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Nafas oladi, qulay</li>
              <li>• Bolali oila uchun ideal</li>
              <li>• Ko&apos;p rang tanlovi</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-kresla-dark mb-2">Charm</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Oson tozalanadi</li>
              <li>• Uzoq muddatli ko&apos;rinish</li>
              <li>• Mehmonxona va ofis uchun</li>
            </ul>
          </div>
        </div>

        <h3 className="font-semibold mb-3">Rang tanlash bo&apos;yicha maslahat</h3>
        <div className="flex flex-wrap gap-3">
          {COLOR_SWATCHES.map((c) => (
            <span
              key={c}
              className="w-10 h-10 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
