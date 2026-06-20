/**
 * Normalize admin list API responses — supports paginated `{ data: { items } }` and legacy shapes.
 */
export function unwrapListItems(data, legacyKey) {
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.[legacyKey])) return data[legacyKey]
  if (Array.isArray(data?.data?.[legacyKey])) return data.data[legacyKey]
  return []
}

export function unwrapPagination(data) {
  const block = data?.data
  if (!block || !Array.isArray(block.items)) return null
  return {
    items: block.items,
    total: block.total ?? block.items.length,
    page: block.page ?? 1,
    limit: block.limit ?? block.items.length,
    totalPages: block.totalPages ?? 1,
  }
}
