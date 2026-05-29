function escapeCsvCell(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function downloadCsv(filename, rows, columns) {
  if (!rows?.length) {
    return { ok: false, message: 'No data to export' }
  }

  const header = columns.map((c) => escapeCsvCell(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(','))
    .join('\n')

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}
