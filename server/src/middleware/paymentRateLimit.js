const buckets = new Map()

/**
 * Simple in-memory rate limiter for payment webhooks.
 */
export function paymentRateLimit({ windowMs = 60000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs }

    if (now > entry.resetAt) {
      entry.count = 0
      entry.resetAt = now + windowMs
    }

    entry.count += 1
    buckets.set(key, entry)

    if (entry.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests' })
    }

    return next()
  }
}
