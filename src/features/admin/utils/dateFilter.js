export const DATE_RANGE_OPTIONS = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: '12months', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
]

const LEGACY_DAYS = { '7d': 7, '30d': 30, '90d': 90 }

export function getDateRangeLabel(dateRange) {
  return DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || 'Last 30 Days'
}

export function getDateRangeCutoff(dateRange) {
  if (dateRange === 'all') return null

  const opt = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)
  if (!opt) {
    const legacyDays = LEGACY_DAYS[dateRange]
    if (legacyDays) return Date.now() - legacyDays * 24 * 60 * 60 * 1000
    return Date.now() - 30 * 24 * 60 * 60 * 1000
  }

  const now = Date.now()
  switch (dateRange) {
    case '7days':
      return now - 7 * 24 * 60 * 60 * 1000
    case '30days':
      return now - 30 * 24 * 60 * 60 * 1000
    case '90days':
      return now - 90 * 24 * 60 * 60 * 1000
    case '12months':
      return now - 365 * 24 * 60 * 60 * 1000
    default:
      return now - 30 * 24 * 60 * 60 * 1000
  }
}

/** Client-side fallback for views without server date filtering (categories, customers, CSV). */
export function filterByDateRange(items, dateRange, dateKey = 'createdAt') {
  const list = Array.isArray(items) ? items : []
  const cutoff = getDateRangeCutoff(dateRange)
  if (!cutoff) return list

  return list.filter((item) => {
    const raw = item[dateKey] ?? item.date ?? item.updatedAt
    if (!raw) return true
    return new Date(raw).getTime() >= cutoff
  })
}

export function matchesSearch(item, query, fields = ['name']) {
  if (!query?.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((field) => {
    const value = item[field]
    return value != null && String(value).toLowerCase().includes(q)
  })
}
