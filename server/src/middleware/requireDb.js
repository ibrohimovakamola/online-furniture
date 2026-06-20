import { getDbStatus, isDbConnected } from '../config/db.js'

function buildUnavailableMessage() {
  const { state, error } = getDbStatus()

  if (state === 'connecting') {
    return 'Database is starting up. Please wait a few seconds and try again.'
  }

  if (error?.includes('Visual C++') || error?.includes('vc_redist')) {
    return error
  }

  if (error?.includes('ENOSPC') || error?.includes('no space left') || error?.includes('Not enough disk space')) {
    return (
      'Database failed to start: disk is full (no space left on C:). ' +
      'Free at least 1 GB, or use MongoDB Atlas (cloud) in server/.env instead of MONGODB_URI=memory.'
    )
  }

  if (error?.includes('MONGODB_URI is not defined')) {
    return 'Server is misconfigured: MONGODB_URI is missing. Copy server/.env.example to server/.env and restart the backend.'
  }

  if (error?.includes('fassert') || error?.includes('In-memory MongoDB')) {
    return (
      'Local database failed to start. Restart the backend (npm run dev). ' +
      'If this persists, set MEMORY_DB_PERSIST=false or MONGODB_URI=mongodb://127.0.0.1:27017/exclusive in server/.env.'
    )
  }

  if (error?.includes('ECONNREFUSED') || error?.includes('connect')) {
    return (
      'Cannot reach MongoDB. Start local MongoDB or set MONGODB_URI=memory in server/.env, then restart the backend.'
    )
  }

  return (
    'Database unavailable. Ensure the backend is running (npm run dev) and MONGODB_URI is set in server/.env.'
  )
}

/** Block API routes until MongoDB is ready; return 503 JSON instead of crashing. */
export function requireDb(req, res, next) {
  if (req.path === '/health') {
    return next()
  }

  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: buildUnavailableMessage(),
      database: getDbStatus(),
    })
  }

  return next()
}
