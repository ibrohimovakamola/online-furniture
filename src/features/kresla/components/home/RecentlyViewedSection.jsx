import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../../../../hook/useFetch'
import { readJSON, STORAGE_KEYS } from '../../utils/storage'
import PremiumProductCard from '../../../../components/PremiumProductCard'

export default function RecentlyViewedSection() {
  const [ids, setIds] = useState([])
  const { state } = useFetch('products', { limit: 50 })

  useEffect(() => {
    const list = readJSON(STORAGE_KEYS.recentlyViewed, [])
    setIds(Array.isArray(list) ? list : [])
  }, [])

  const products = (state?.products ?? []).filter((p) => ids.includes(String(p.id)))

  if (!ids.length || !products.length) return null

  const ordered = ids.map((id) => products.find((p) => String(p.id) === id)).filter(Boolean)

  return (
    <section className="py-10 md:py-14 bg-kresla-light/50">
      <div className="container mx-auto max-w-[1360px] px-3">
        <h2 className="text-2xl md:text-3xl font-semibold text-kresla-dark mb-6">Yaqinda ko&apos;rganlar</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
          {ordered.map((product) => (
            <div key={product.id} className="min-w-[220px] max-w-[260px] shrink-0 snap-start">
              <PremiumProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
