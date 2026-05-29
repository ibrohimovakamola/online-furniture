/** Valid #RGB or #RRGGBB hex */
export const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

/**
 * Normalize a single hex string to lowercase #rrggbb.
 * Returns null if invalid.
 */
export function normalizeHexColor(value) {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null

  let hex = raw
  if (!hex.startsWith('#')) hex = `#${hex}`
  if (!HEX_COLOR_RE.test(hex)) return null

  if (hex.length === 4) {
    const [, r, g, b] = hex
    hex = `#${r}${r}${g}${g}${b}${b}`
  }

  return hex.toLowerCase()
}

/**
 * Flatten nested arrays, JSON strings, comma lists → deduped string[] of valid hex.
 */
export function sanitizeColors(input) {
  const collected = []

  const visit = (value) => {
    if (value == null || value === '') return

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (typeof value === 'object') {
      visit(value.color ?? value.hex ?? value.value)
      return
    }

    const str = String(value).trim()
    if (!str) return

    if (str.startsWith('[') || str.startsWith('{')) {
      try {
        visit(JSON.parse(str))
        return
      } catch {
        /* fall through */
      }
    }

    if (str.includes(',')) {
      str.split(',').forEach(visit)
      return
    }

    const hex = normalizeHexColor(str)
    if (hex) collected.push(hex)
  }

  visit(input)
  return [...new Set(collected)]
}
