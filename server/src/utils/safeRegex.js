/**
 * Safe MongoDB $regex construction — always escape user input.
 */
export function escapeRegex(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @param {string} value
 * @param {{ maxLength?: number, flags?: string }} [options]
 */
export function buildSearchRegex(value, options = {}) {
  const { maxLength = 120, flags = 'i' } = options
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  if (trimmed.length > maxLength) {
    const err = new Error(`Search query must be at most ${maxLength} characters`)
    err.statusCode = 400
    throw err
  }
  return new RegExp(escapeRegex(trimmed), flags)
}

/**
 * Exact match regex (case-insensitive) with escaped input.
 */
export function buildExactRegex(value, flags = 'i') {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  return new RegExp(`^${escapeRegex(trimmed)}$`, flags)
}
