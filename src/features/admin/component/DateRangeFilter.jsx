import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { DATE_RANGE_OPTIONS, getDateRangeLabel } from '../utils/dateFilter'

function DateRangeFilter({ value, onChange, className = '', options = DATE_RANGE_OPTIONS }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const label = getDateRangeLabel(value)

  const handleSelect = (next) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="admin-btn admin-btn--ghost gap-2 min-w-[148px] justify-between"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Date range: ${label}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="date-range-filter__menu absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-[rgba(94,234,212,0.2)] shadow-xl"
          role="listbox"
          aria-label="Select date range"
        >
          <div className="date-range-filter__header px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#5eead4]/90">
            Date range
          </div>
          <ul className="py-1">
            {options.map((opt) => {
              const selected = value === opt.value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`date-range-filter__option flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? 'bg-[rgba(94,234,212,0.12)] text-[#5eead4] font-medium'
                        : 'text-[#f0f4f4] hover:bg-[rgba(255,255,255,0.06)]'
                    }`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter
