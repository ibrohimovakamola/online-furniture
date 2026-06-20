const TIER_LABELS = {
  standard: { label: 'Standard Partner', className: 'bg-slate-100 text-slate-800 ring-slate-200' },
  premium: { label: 'Premium Partner', className: 'bg-violet-100 text-violet-800 ring-violet-200' },
}

export default function B2BTierBadge({ tier = 'standard' }) {
  const cfg = TIER_LABELS[tier] || TIER_LABELS.standard
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset bg-emerald-100 text-emerald-800 ring-emerald-200">
      Verified Partner
    </span>
  )
}
