/** Supported admin date-range query values */
export const DATE_RANGE_VALUES = ['7days', '30days', '90days', '12months']

const LEGACY_MAP = {
  '7d': '7days',
  '30d': '30days',
  '90d': '90days',
  '12m': '12months',
  all: null,
}

/**
 * Normalize req.query.dateRange (defaults to 30days).
 * @returns {string|null} canonical key or null for "all time"
 */
export function normalizeDateRangeKey(dateRange) {
  if (!dateRange || dateRange === 'all') return null
  const key = String(dateRange).trim()
  if (LEGACY_MAP[key] !== undefined) return LEGACY_MAP[key]
  if (DATE_RANGE_VALUES.includes(key)) return key
  return '30days'
}

/**
 * Returns a Date at the start of the window, or null for all time.
 */
export function getDateRangeStartDate(dateRange) {
  const key = normalizeDateRangeKey(dateRange)
  if (!key) return null

  const start = new Date()

  switch (key) {
    case '7days':
      start.setDate(start.getDate() - 7)
      break
    case '30days':
      start.setDate(start.getDate() - 30)
      break
    case '90days':
      start.setDate(start.getDate() - 90)
      break
    case '12months':
      start.setMonth(start.getMonth() - 12)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  start.setHours(0, 0, 0, 0)
  return start
}

/** MongoDB filter fragment: { createdAt: { $gte: Date } } or {} */
export function buildCreatedAtFilter(dateRange) {
  const start = getDateRangeStartDate(dateRange)
  if (!start) return {}
  return { createdAt: { $gte: start } }
}

export function parseDateRangeQuery(query = {}) {
  const raw = query.dateRange
  if (raw === 'all') return null
  return normalizeDateRangeKey(raw) || '30days'
}
