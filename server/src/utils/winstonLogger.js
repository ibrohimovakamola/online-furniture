import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.join(__dirname, '../../logs')

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level}] ${message}${extra}`
  })
)

function rotateTransport(filename, level) {
  return new DailyRotateFile({
    dirname: logsDir,
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: jsonFormat,
  })
}

const transports = [
  rotateTransport('error', 'error'),
  rotateTransport('warn', 'warn'),
  rotateTransport('combined', 'info'),
]

if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: consoleFormat,
    })
  )
} else {
  transports.push(
    new winston.transports.Console({
      level: 'warn',
      format: jsonFormat,
    })
  )
}

const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
})

/**
 * Structured application error log entry.
 */
export function logAppError(entry) {
  const {
    errorId,
    statusCode = 500,
    message,
    stack,
    method,
    path,
    userId,
    ipAddress,
    code,
    isOperational,
  } = entry

  const payload = {
    errorId,
    statusCode,
    message,
    method,
    path,
    userId: userId ? String(userId) : undefined,
    ipAddress,
    code,
    isOperational,
    ...(stack && !isProduction ? { stack } : {}),
  }

  if (statusCode >= 500) {
    logger.error('request_error', payload)
  } else if (statusCode >= 400) {
    logger.warn('request_error', payload)
  } else {
    logger.info('request_error', payload)
  }
}

export function logInfo(message, meta = {}) {
  logger.info(message, meta)
}

export function logWarn(message, meta = {}) {
  logger.warn(message, meta)
}

export function logDebug(message, meta = {}) {
  logger.debug(message, meta)
}

export default logger
