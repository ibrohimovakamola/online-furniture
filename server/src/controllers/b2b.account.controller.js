import B2BProfile from '../models/B2BProfile.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'

/** GET /api/b2b/account */
export const getB2BAccount = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  res.json({
    success: true,
    account: profile.toPublicObject(),
    user: req.user.toSafeObject(),
  })
})

/** PUT /api/b2b/account */
export const updateB2BAccount = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  const fields = [
    'companyName',
    'companyType',
    'taxId',
    'registrationNumber',
    'businessAddress',
    'postalCode',
    'website',
    'phone',
    'contactTitle',
  ]

  for (const key of fields) {
    if (req.body[key] != null) profile[key] = String(req.body[key]).trim()
  }

  profile.auditLog.push({ action: 'account_updated', by: req.user._id, note: 'Company info updated' })
  await profile.save()

  res.json({ success: true, account: profile.toPublicObject() })
})

/** GET /api/b2b/account/users */
export const listTeamMembers = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  res.json({ success: true, teamMembers: profile.teamMembers || [] })
})

/** POST /api/b2b/account/users */
export const addTeamMember = asyncHandler(async (req, res) => {
  const { email, firstName, lastName, role = 'buyer' } = req.body
  if (!email?.trim()) throw new AppError('Team member email is required', 400)

  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  const normalized = email.toLowerCase().trim()
  if (profile.teamMembers.some((m) => m.email === normalized)) {
    throw new AppError('Team member already exists', 409)
  }

  profile.teamMembers.push({ email: normalized, firstName, lastName, role })
  await profile.save()

  res.status(201).json({ success: true, teamMembers: profile.teamMembers })
})

/** DELETE /api/b2b/account/users/:userId — index in teamMembers array */
export const removeTeamMember = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  const idx = Number(req.params.userId)
  if (Number.isNaN(idx) || idx < 0 || idx >= profile.teamMembers.length) {
    throw new AppError('Team member not found', 404)
  }

  profile.teamMembers.splice(idx, 1)
  await profile.save()

  res.json({ success: true, teamMembers: profile.teamMembers })
})

/** PUT /api/b2b/account/settings */
export const updateAccountSettings = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('B2B account not found', 404)

  profile.settings = { ...profile.settings?.toObject?.() || profile.settings || {}, ...req.body }
  await profile.save()

  res.json({ success: true, settings: profile.settings })
})

/** GET /api/b2b/me — legacy profile */
export const getMyB2BProfile = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findOne({ user: req.user._id })
  res.json({ success: true, profile: profile ? profile.toPublicObject() : null })
})

/** PATCH /api/b2b/me/license */
export const uploadB2BLicense = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('License document file is required', 400)

  const profile = await B2BProfile.findOne({ user: req.user._id })
  if (!profile) throw new AppError('No B2B application found', 404)

  profile.licenseDocumentUrl = `/uploads/${req.file.filename}`
  if (profile.status === 'rejected') {
    profile.status = 'pending'
    profile.rejectedReason = ''
  }
  profile.auditLog.push({ action: 'license_uploaded', by: req.user._id, note: 'License updated' })
  await profile.save()

  res.json({ success: true, profile: profile.toPublicObject() })
})
