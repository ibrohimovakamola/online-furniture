import { B2B_STATUS_LABELS } from '../data/b2bContent'

export default function B2BStatusBadge({ status }) {
  const cfg = B2B_STATUS_LABELS[status] || B2B_STATUS_LABELS.pending

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
