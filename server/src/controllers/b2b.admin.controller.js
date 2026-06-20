import B2BProfile from '../models/B2BProfile.js'
import Order from '../models/Order.js'
import { ROLES } from '../config/roles.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { formatB2BOrder } from '../utils/b2bHelpers.js'
import { emailB2BApproved, emailB2BRejected } from '../utils/b2bEmails.js'

/** GET /api/admin/b2b-users */
export const listB2BUsers = asyncHandler(async (req, res) => {
  const { status = '', search = '' } = req.query
  const filter = {}
  if (status) filter.status = status

  let profiles = await B2BProfile.find(filter)
    .populate('user', 'firstName lastName email role isActive createdAt')
    .sort({ createdAt: -1 })
    .lean()

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    profiles = profiles.filter(
      (p) =>
        p.companyName?.toLowerCase().includes(q) ||
        p.taxId?.includes(q) ||
        p.user?.email?.toLowerCase().includes(q)
    )
  }

  res.json({
    success: true,
    users: profiles.map((p) => ({
      id: p._id,
      userId: p.user?._id,
      companyName: p.companyName,
      companyType: p.companyType,
      taxId: p.taxId,
      registrationNumber: p.registrationNumber,
      status: p.status,
      phone: p.phone,
      creditTerms: p.creditTerms,
      creditLimit: p.creditLimit,
      licenseDocumentUrl: p.licenseDocumentUrl,
      user: p.user,
      createdAt: p.createdAt,
    })),
  })
})

async function setB2BStatus(profileId, status, adminUser, extra = {}) {
  const profile = await B2BProfile.findById(profileId).populate('user')
  if (!profile) throw new AppError('B2B user not found', 404)

  profile.status = status
  Object.assign(profile, extra)

  if (status === 'verified') {
    profile.verifiedAt = new Date()
    profile.verifiedBy = adminUser._id
    if (profile.user) {
      profile.user.role = ROLES.B2B_PARTNER
      await profile.user.save()
    }
  }

  if (status === 'rejected' && profile.user?.role === ROLES.B2B_PARTNER) {
    profile.user.role = ROLES.CUSTOMER
    await profile.user.save()
  }

  profile.auditLog.push({
    action: `admin_${status}`,
    by: adminUser._id,
    note: extra.verificationNotes || extra.rejectedReason || '',
  })
  await profile.save()

  if (status === 'verified' && profile.user) {
    emailB2BApproved({ user: profile.user, profile: profile.toPublicObject() })
  }
  if (status === 'rejected' && profile.user) {
    emailB2BRejected({ user: profile.user, profile: profile.toPublicObject() })
  }

  return profile
}

/** PUT /api/admin/b2b-users/:userId/approve */
export const approveB2BUser = asyncHandler(async (req, res) => {
  const profile = await setB2BStatus(req.params.userId, 'verified', req.user, {
    creditTerms: req.body.creditTerms || 'net30',
    creditLimit: req.body.creditLimit ?? 50_000_000,
    verificationNotes: req.body.verificationNotes || 'Approved by admin',
  })

  res.json({ success: true, message: 'B2B partner approved', profile: profile.toPublicObject() })
})

/** PUT /api/admin/b2b-users/:userId/reject */
export const rejectB2BUser = asyncHandler(async (req, res) => {
  const profile = await setB2BStatus(req.params.userId, 'rejected', req.user, {
    rejectedReason: req.body.rejectedReason || 'Application rejected',
  })

  res.json({ success: true, message: 'B2B application rejected', profile: profile.toPublicObject() })
})

/** GET /api/admin/b2b-users/:userId/orders */
export const getB2BUserOrders = asyncHandler(async (req, res) => {
  const profile = await B2BProfile.findById(req.params.userId)
  if (!profile) throw new AppError('B2B user not found', 404)

  const orders = await Order.find({ customer: profile.user, isB2B: true }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, orders: orders.map(formatB2BOrder) })
})

/** POST /api/admin/b2b-users/:userId/message */
export const messageB2BUser = asyncHandler(async (req, res) => {
  const { subject, message } = req.body
  if (!message?.trim()) throw new AppError('Message body is required', 400)

  const profile = await B2BProfile.findById(req.params.userId).populate('user', 'email firstName')
  if (!profile) throw new AppError('B2B user not found', 404)

  const to = profile.user?.email
  console.log(`[b2b-admin] Message to ${to}: ${subject || 'B2B Account Update'} — ${message}`)

  profile.auditLog.push({
    action: 'admin_message',
    by: req.user._id,
    note: `${subject || 'Message'}: ${message.slice(0, 200)}`,
  })
  await profile.save()

  res.json({
    success: true,
    message: `Message queued for ${to} (email integration placeholder)`,
  })
})

/** Legacy admin routes — /api/admin/b2b/applications */
export const listB2BApplications = asyncHandler(async (req, res) => {
  const { status = '', search = '' } = req.query
  const filter = {}
  if (status) filter.status = status

  let profiles = await B2BProfile.find(filter)
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .lean()

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    profiles = profiles.filter(
      (p) =>
        p.companyName?.toLowerCase().includes(q) ||
        p.taxId?.includes(q) ||
        p.user?.email?.toLowerCase().includes(q)
    )
  }

  res.json({
    success: true,
    applications: profiles.map((p) => ({
      id: p._id,
      companyName: p.companyName,
      companyType: p.companyType,
      taxId: p.taxId,
      registrationNumber: p.registrationNumber,
      status: p.status,
      phone: p.phone,
      businessAddress: p.businessAddress,
      postalCode: p.postalCode,
      employeeCount: p.employeeCount,
      annualTurnover: p.annualTurnover,
      preferredAccountManager: p.preferredAccountManager,
      registrationCertificateUrl: p.registrationCertificateUrl,
      licenseDocumentUrl: p.licenseDocumentUrl,
      verificationNotes: p.verificationNotes,
      rejectedReason: p.rejectedReason,
      createdAt: p.createdAt,
      user: p.user,
    })),
  })
})

export const updateB2BApplicationStatus = asyncHandler(async (req, res) => {
  const { status, verificationNotes, rejectedReason, creditTerms, creditLimit } = req.body
  const profileId = req.params.id

  if (status === 'verified') {
    const profile = await setB2BStatus(profileId, 'verified', req.user, {
      creditTerms: creditTerms || 'net30',
      creditLimit: creditLimit ?? 50_000_000,
      verificationNotes: verificationNotes || 'Approved by admin',
    })
    return res.json({ success: true, application: profile.toPublicObject() })
  }

  if (status === 'rejected') {
    const profile = await setB2BStatus(profileId, 'rejected', req.user, {
      rejectedReason: rejectedReason || verificationNotes || 'Application rejected',
    })
    return res.json({ success: true, application: profile.toPublicObject() })
  }

  const allowed = ['pending', 'under_review']
  if (!allowed.includes(status)) throw new AppError('Invalid status', 400)

  const profile = await B2BProfile.findById(profileId)
  if (!profile) throw new AppError('Application not found', 404)
  profile.status = status
  if (verificationNotes != null) profile.verificationNotes = verificationNotes
  await profile.save()
  res.json({ success: true, application: profile.toPublicObject() })
})
