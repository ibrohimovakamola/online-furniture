import { getDateRangeStartDate, normalizeDateRangeKey } from './dateRange.js'

const GROUP_BY_VALUES = ['day', 'week', 'month']

/**
 * Parse admin analytics date range from startDate/endDate ISO strings or legacy dateRange.
 * @returns {{ start: Date, end: Date, groupBy: string, label: string }}
 */
export function parseAnalyticsDateRange(query = {}) {
  let start
  let end = new Date()
  end.setHours(23, 59, 59, 999)

  if (query.startDate) {
    start = new Date(String(query.startDate))
    if (Number.isNaN(start.getTime())) {
      start = getDateRangeStartDate('30days')
    } else {
      start.setHours(0, 0, 0, 0)
    }
  } else {
    const legacy = query.dateRange === 'all' ? null : normalizeDateRangeKey(query.dateRange)
    start = getDateRangeStartDate(legacy) || new Date(0)
    if (legacy) {
      /* getDateRangeStartDate already zeroes hours */
    } else if (!query.dateRange || query.dateRange === 'all') {
      start = new Date(0)
    }
  }

  if (query.endDate) {
    end = new Date(String(query.endDate))
    if (Number.isNaN(end.getTime())) {
      end = new Date()
      end.setHours(23, 59, 59, 999)
    } else {
      end.setHours(23, 59, 59, 999)
    }
  }

  if (start > end) {
    const tmp = start
    start = end
    end = tmp
    end.setHours(23, 59, 59, 999)
  }

  const groupBy = GROUP_BY_VALUES.includes(query.groupBy) ? query.groupBy : 'day'

  const startLabel = start.getTime() === 0 ? 'all-time' : start.toISOString().slice(0, 10)
  const endLabel = end.toISOString().slice(0, 10)
  const label = start.getTime() === 0 ? `all-time to ${endLabel}` : `${startLabel} to ${endLabel}`

  return { start, end, groupBy, label }
}

/** MongoDB createdAt filter for a date window */
export function buildDateWindowFilter({ start, end }) {
  if (start.getTime() === 0) {
    return { createdAt: { $lte: end } }
  }
  return { createdAt: { $gte: start, $lte: end } }
}

/** Aggregation expression for grouping by day/week/month */
export function dateGroupExpression(groupBy, field = '$createdAt') {
  switch (groupBy) {
    case 'week':
      return { $dateToString: { format: '%Y-W%V', date: field, timezone: 'UTC' } }
    case 'month':
      return { $dateToString: { format: '%Y-%m', date: field, timezone: 'UTC' } }
    case 'day':
    default:
      return { $dateToString: { format: '%Y-%m-%d', date: field, timezone: 'UTC' } }
  }
}

export function getOrderPayableTotal(order) {
  return Number(order.finalPrice ?? order.total ?? order.totalPrice ?? order.subtotal) || 0
}
