import logger, { logInfo, logWarn, logDebug } from './winstonLogger.js'

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

/**
 * Application logger — Winston in production; Winston + console in development.
 * Avoid raw console.log in runtime code paths.
 */
export function logApp(level, message, meta) {
  if (isTest) return

  const payload = meta && Object.keys(meta).length ? meta : undefined

  if (level === 'error') {
    logger.error(message, payload)
    if (!isProduction) console.error(message, payload ?? '')
    return
  }
  if (level === 'warn') {
    logWarn(message, payload)
    if (!isProduction) console.warn(message, payload ?? '')
    return
  }
  if (level === 'debug') {
    logDebug(message, payload)
    if (!isProduction) console.debug(message, payload ?? '')
    return
  }
  logInfo(message, payload)
  if (!isProduction) console.log(message, payload ?? '')
}

export { logInfo, logWarn, logDebug, logger }
