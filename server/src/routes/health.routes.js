import { Router } from 'express'
import mongoose from 'mongoose'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pingDatabase } from '../config/db.js'

const router = Router()

/**
 * GET /api/health
 *
 * Public liveness probe — no JWT, no requireDb middleware.
 * Used by:
 *   - Render health checks (healthCheckPath: /api/health)
 *   - GitHub Actions smoke tests after deploy
 *   - Uptime monitors (UptimeRobot, Better Stack, etc.)
 *   - Manual smoke tests: curl https://api.mebelsotish.uz/api/health
 *
 * Returns 503 when MongoDB is not reachable so load balancers stop routing traffic.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const readyState = mongoose.connection.readyState
    const dbUp = readyState === 1 && (await pingDatabase())

    if (!dbUp) {
      return res.status(503).json({
        status: 'error',
        database: 'disconnected',
      })
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    })
  })
)

export default router
