export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export function buildImageUrl(filename, req) {
  if (!filename) return null
  if (filename.startsWith('http') || filename.startsWith('/')) return filename
  const base = `${req.protocol}://${req.get('host')}`
  return `${base}/uploads/${filename}`
}
