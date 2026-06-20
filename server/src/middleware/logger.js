import morgan from 'morgan'
import { logWarn, logInfo } from '../utils/winstonLogger.js'

const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS) || 2000

/** Records request start time for duration tracking. */
export function requestTiming(req, _res, next) {
  req._requestStart = Date.now()
  next()
}

/** Logs method, path, status, and duration after response finishes. */
export function requestCompletionLogger(req, res, next) {
  res.on('finish', () => {
    const durationMs = Date.now() - (req._requestStart || Date.now())
    const entry = {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    }

    if (durationMs >= SLOW_REQUEST_MS) {
      logWarn('slow_request', entry)
    } else if (process.env.LOG_ALL_REQUESTS === 'true') {
      logInfo('http_request', entry)
    }
  })
  next()
}

export const httpLogger = morgan(
  process.env.NODE_ENV === 'production'
    ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
    : ':method :url :status :response-time ms'
)

export default {
  requestTiming,
  requestCompletionLogger,
  httpLogger,
}
