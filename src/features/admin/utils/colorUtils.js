export const HEX_COLOR_RE = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

/** Normalize user input to #rrggbb or null if invalid */
export function normalizeHexColor(value) {
  if (value == null) return null
  let hex = String(value).trim()
  if (!hex) return null
  if (!hex.startsWith('#')) hex = `#${hex}`
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return null

  if (hex.length === 4) {
    const [, r, g, b] = hex
    hex = `#${r}${r}${g}${g}${b}${b}`
  }

  return hex.toLowerCase()
}

/** Build a clean colors array for the API (never nested) */
export function buildColorsPayload(hexInputs) {
  const list = Array.isArray(hexInputs) ? hexInputs : [hexInputs]
  const out = []

  for (const item of list) {
    const hex = normalizeHexColor(item)
    if (hex && !out.includes(hex)) out.push(hex)
  }

  return out
}
