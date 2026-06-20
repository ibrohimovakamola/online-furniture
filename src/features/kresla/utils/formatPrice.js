export function formatSom(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '0 so\'m'
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`
}

export function parseSom(str) {
  if (typeof str === 'number') return str
  return Number(String(str).replace(/[^\d]/g, '')) || 0
}
