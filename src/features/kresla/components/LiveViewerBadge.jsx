import { useLiveViewers } from '../hooks/useLiveViewers'

export default function LiveViewerBadge({ productId, className = '' }) {
  const viewers = useLiveViewers(productId)

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-gray-600 transition-opacity duration-500 ${className}`}
      title="Hozir ko'rilmoqda"
    >
      <span aria-hidden>👁</span>
      <span className="tabular-nums">{viewers}</span>
      <span>kishi ko&apos;rmoqda</span>
    </span>
  )
}
