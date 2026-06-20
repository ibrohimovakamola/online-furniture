import { Router } from 'express'

import {

  signup,

  registerCustomer,

  login,

  refreshAccessToken,

  logout,

  getCurrentUser,

  getMe,

  updateProfile,

  deleteAccount,

  changePassword,

  forgotPassword,

  resetPassword,

  createStaffUser,

  listStaffUsers,

  deleteStaffUser,

} from '../controllers/auth.controller.js'

import {

  b2bRegister,

  b2bLogin,

  verifyBusiness,

  b2bUserProfile,

} from '../controllers/b2b.auth.controller.js'

import {

  protect,

  requireAdminPanelAccess,

  authorizePermission,

} from '../middleware/auth.js'

import { validateRequest } from '../middleware/validate.js'

import {

  signupSchema,

  loginSchema,

  updateProfileSchema,

  deleteAccountSchema,

} from '../validators/auth.schemas.js'

import {

  loginValidators,

  signupValidators,

  forgotPasswordValidators,

  resetPasswordValidators,

  changePasswordValidators,

} from '../middleware/validationChains.js'

import { sanitizeBodyStrings } from '../middleware/validators.js'

import { PERMISSIONS } from '../config/roles.js'

import { asyncHandler } from '../utils/asyncHandler.js'

import { withMulter } from '../middleware/multerError.js'

import { b2bRegistrationUpload } from '../middleware/upload.js'

import { authLimiter, passwordResetLimiter } from '../middleware/security.js'



const router = Router()



/* ── Public ── */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Account created
 */
router.post('/signup', sanitizeBodyStrings(), signupValidators, validateRequest(signupSchema), signup)

router.post('/register', sanitizeBodyStrings(), signupValidators, validateRequest(signupSchema), registerCustomer)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, sanitizeBodyStrings(), loginValidators, validateRequest(loginSchema), login)

router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidators, forgotPassword)

router.post('/reset-password', passwordResetLimiter, resetPasswordValidators, resetPassword)

router.post('/refresh', refreshAccessToken)



/* ── B2B auth ── */

router.post('/b2b-register', withMulter(b2bRegistrationUpload), b2bRegister)

router.post('/b2b-login', authLimiter, b2bLogin)

router.post('/verify-business', protect, withMulter(b2bRegistrationUpload), verifyBusiness)

router.get('/user-profile', protect, b2bUserProfile)



/* ── Authenticated ── */

router.get('/me', protect, getMe)

router.put('/profile', protect, sanitizeBodyStrings(), validateRequest(updateProfileSchema), updateProfile)

router.post('/logout', protect, logout)

router.delete('/account', protect, validateRequest(deleteAccountSchema), deleteAccount)

router.post('/change-password', protect, changePasswordValidators, changePassword)



/* ── Admin panel gate ── */

router.use('/admin', protect, requireAdminPanelAccess)



router.get(

  '/admin/ping',

  asyncHandler(async (req, res) => {

    res.json({ success: true, role: req.user.role })

  })

)



router

  .route('/admin/users')

  .get(authorizePermission(PERMISSIONS.MANAGE_USERS), listStaffUsers)

  .post(authorizePermission(PERMISSIONS.MANAGE_MANAGERS), createStaffUser)



router.delete(

  '/admin/users/:id',

  authorizePermission(PERMISSIONS.MANAGE_USERS),

  deleteStaffUser

)



export default router



/** Named exports for documentation / tests */

export { getCurrentUser, signup, login, logout, updateProfile, deleteAccount }


