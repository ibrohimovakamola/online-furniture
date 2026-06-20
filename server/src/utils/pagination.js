/**
 * Shared pagination helpers for admin list endpoints.
 */
export function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit)
  const page = Math.max(Number(query.page) || 1, 1)
  const skip = (page - 1) * limit
  return { limit, page, skip }
}

export function parseSort(query = {}, allowed = {}, defaultSort = { createdAt: -1 }) {
  const key = String(query.sortBy || query.sort || '').trim()
  if (key && allowed[key]) return allowed[key]
  return defaultSort
}

export function buildPaginatedResponse(items, { total, page, limit }) {
  const safeTotal = Number(total) || 0
  const safeLimit = Math.max(Number(limit) || 1, 1)
  const safePage = Math.max(Number(page) || 1, 1)
  return {
    success: true,
    data: {
      items,
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      totalPages: safeTotal === 0 ? 0 : Math.ceil(safeTotal / safeLimit),
    },
  }
}
