import { ChevronDown } from 'lucide-react'

export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_STYLES = {
  pending: 'admin-badge--pending',
  processing: 'admin-badge--shipping',
  shipped: 'admin-badge--shipping',
  delivered: 'admin-badge--success',
  cancelled: 'admin-badge--danger',
}

function StatusBadge({ status, onChange, disabled }) {
  const label = ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label || status

  if (!onChange) {
    return <span className={`admin-badge ${STATUS_STYLES[status] || ''}`}>{label}</span>
  }

  return (
    <div className="relative inline-flex">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`admin-badge appearance-none pr-7 cursor-pointer border-0 outline-none ${STATUS_STYLES[status] || ''}`}
      >
        {ORDER_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-70" />
    </div>
  )
}

export default StatusBadge
