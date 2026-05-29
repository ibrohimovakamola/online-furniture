import { Router } from 'express'
import {
  registerCustomer,
  login,
  getMe,
  changePassword,
  createStaffUser,
  listStaffUsers,
  deleteStaffUser,
} from '../controllers/auth.controller.js'
import {
  protect,
  requireAdminPanelAccess,
  authorizePermission,
} from '../middleware/auth.js'
import { PERMISSIONS } from '../config/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/* ── Public ── */
router.post('/register', registerCustomer)
router.post('/login', login)

/* ── Authenticated ── */
router.get('/me', protect, getMe)
router.post('/change-password', protect, changePassword)

/* ── Admin panel gate — all routes below require admin role ── */
router.use('/admin', protect, requireAdminPanelAccess)

router.get(
  '/admin/ping',
  asyncHandler(async (req, res) => {
    res.json({ success: true, role: req.user.role })
  })
)

/** Super Admin only — user management */
router
  .route('/admin/users')
  .get(
    authorizePermission(PERMISSIONS.MANAGE_USERS),
    listStaffUsers
  )
  .post(
    authorizePermission(PERMISSIONS.MANAGE_MANAGERS),
    createStaffUser
  )

router.delete(
  '/admin/users/:id',
  authorizePermission(PERMISSIONS.MANAGE_USERS),
  deleteStaffUser
)

export default router
