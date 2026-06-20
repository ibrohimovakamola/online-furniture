import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'

export default function CompareBar() {
  const { list } = useCompare()
  if (!list.length) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[85] bg-kresla-dark text-white px-4 py-3 shadow-lg border-t border-kresla-primary/30">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {list.length} ta mahsulot tanlandi
        </span>
        <Link
          to="/compare"
          className="px-4 py-2 rounded-lg bg-kresla-primary hover:bg-kresla-accent font-medium transition-colors"
        >
          Taqqoslash →
        </Link>
      </div>
    </div>
  )
}
