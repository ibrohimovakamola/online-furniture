/**
 * Release request-scoped resources after each response to help GC under memory pressure.
 * Development + production safe — only clears references, not shared caches.
 */

function clearMulterFiles(req) {
  if (req.file) {
    req.file.buffer = null
    req.file = null
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => {
        if (f?.buffer) f.buffer = null
      })
    } else if (typeof req.files === 'object') {
      Object.values(req.files).flat().forEach((f) => {
        if (f?.buffer) f.buffer = null
      })
    }
    req.files = null
  }
}

function trimLargeBody(req) {
  if (!req.body || typeof req.body !== 'object') return
  const isMultipart = req.is('multipart/form-data')
  if (!isMultipart) return

  for (const key of Object.keys(req.body)) {
    const val = req.body[key]
    if (typeof val === 'string' && val.length > 64_000) {
      req.body[key] = ''
    }
  }
}

/** Drop multer buffers and oversized multipart strings once the response is sent. */
export function resourceCleanup(req, res, next) {
  const cleanup = () => {
    clearMulterFiles(req)
    trimLargeBody(req)
    if (req._requestStart) req._requestStart = null
  }

  res.on('finish', cleanup)
  res.on('close', cleanup)
  next()
}

/** Optional GC hint in dev when heap is high (requires --expose-gc). */
export function maybeCollectGarbage(req, res, next) {
  if (process.env.NODE_ENV !== 'development') return next()
  if (process.env.DEV_GC_HINT !== 'true') return next()
  if (typeof global.gc !== 'function') return next()

  res.on('finish', () => {
    const heapUsedMb = process.memoryUsage().heapUsed / 1024 / 1024
    const threshold = Number(process.env.DEV_GC_HINT_MB) || 2048
    if (heapUsedMb >= threshold) {
      global.gc()
    }
  })
  next()
}
