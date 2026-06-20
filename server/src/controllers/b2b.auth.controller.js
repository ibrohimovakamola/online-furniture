import User from '../models/User.js'
import B2BProfile from '../models/B2BProfile.js'
import { issueAuthSession } from '../utils/jwt.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { registerB2BPartner } from './b2b.controller.js'

function uploadedFileUrl(req, fieldName) {
  const fromFields = req.files?.[fieldName]?.[0]
  if (fromFields) return `/uploads/${fromFields.filename}`
  if (req.file?.fieldname === fieldName) return `/uploads/${req.file.filename}`
  return null
}

/** POST /api/auth/b2b-register */
export const b2bRegister = registerB2BPartner

/** POST /api/auth/b2b-login */
export const b2bLogin = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = req.body?.password

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403)
  }

  const profile = await B2BProfile.findOne({ user: user._id })
  if (!profile) {
    throw new AppError('No B2B profile found. Register at /api/auth/b2b-register first.', 404)
  }

  user.lastLoginAt = new Date()
  await user.save()

  const token = await issueAuthSession(user, res)

  res.json({
    success: true,
    token,
    user: user.toSafeObject(),
    profile: profile.toPublicObject(),
    portalAccess: profile.status === 'verified',
  })
})

/** POST /api/auth/verify-business — upload license / resubmit verification */
export const verifyBusiness = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('Authentication required', 401)

  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B profile not found', 404)

  const { taxId, registrationNumber, companyName, businessAddress, postalCode } = req.body

  if (taxId) profile.taxId = String(taxId).trim()
  if (registrationNumber) profile.registrationNumber = String(registrationNumber).trim()
  if (companyName) profile.companyName = String(companyName).trim()
  if (businessAddress) profile.businessAddress = String(businessAddress).trim()
  if (postalCode) profile.postalCode = String(postalCode).trim()

  const certUrl = uploadedFileUrl(req, 'registrationCertificate')
  const licenseUrl = uploadedFileUrl(req, 'licenseDocument')
  if (certUrl) profile.registrationCertificateUrl = certUrl
  if (licenseUrl) profile.licenseDocumentUrl = licenseUrl

  if (profile.status === 'rejected') {
    profile.status = 'pending'
    profile.rejectedReason = ''
  } else if (profile.status === 'pending') {
    profile.status = 'under_review'
  }

  profile.auditLog.push({
    action: 'verification_submitted',
    by: req.user._id,
    note: 'Business verification documents updated',
  })
  await profile.save()

  res.json({
    success: true,
    message: 'Verification documents submitted for review',
    profile: profile.toPublicObject(),
  })
})

/** GET /api/auth/user-profile — user + B2B profile */
export const b2bUserProfile = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })

  res.json({
    success: true,
    user: req.user.toSafeObject(),
    profile: profile ? profile.toPublicObject() : null,
    portalAccess: profile?.status === 'verified',
  })
})
