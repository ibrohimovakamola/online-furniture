import User from '../models/User.js'
import B2BProfile from '../models/B2BProfile.js'
import { ROLES } from '../config/roles.js'
import { issueAuthSession } from '../utils/jwt.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import {
  B2B_COMPANY_TYPES,
  B2B_TURNOVER_RANGES,
  B2B_EMPLOYEE_RANGES,
  getAccountManagerById,
} from '../config/b2b.js'
import {
  emailB2BApplicationSubmitted,
  emailB2BApplicationReceived,
} from '../utils/b2bEmails.js'

function uploadedFileUrl(req, fieldName) {
  const fromFields = req.files?.[fieldName]?.[0]
  if (fromFields) return `/uploads/${fromFields.filename}`
  if (req.file?.fieldname === fieldName) return `/uploads/${req.file.filename}`
  return null
}

/** POST /api/b2b/register | POST /api/auth/b2b-register */
export const registerB2BPartner = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    companyName,
    companyType,
    taxId,
    registrationNumber,
    businessAddress,
    postalCode,
    website,
    phone,
    contactTitle,
    employeeCount,
    annualTurnover,
    preferredAccountManager,
    message,
    acceptTerms,
  } = req.body

  if (!firstName || !lastName || !email || !password) {
    throw new AppError('Contact name, email, and password are required', 400)
  }
  if (!companyName?.trim()) {
    throw new AppError('Business name (legal company name) is required', 400)
  }
  if (!taxId?.trim()) {
    throw new AppError('Tax ID number (STIR) is required', 400)
  }
  if (!registrationNumber?.trim()) {
    throw new AppError('Registration number (INN) is required', 400)
  }
  if (!businessAddress?.trim() || !postalCode?.trim()) {
    throw new AppError('Full business address with postal code is required', 400)
  }
  if (!phone?.trim()) {
    throw new AppError('Phone number is required', 400)
  }
  if (!employeeCount || !B2B_EMPLOYEE_RANGES.includes(employeeCount)) {
    throw new AppError('Number of employees is required', 400)
  }
  if (!annualTurnover || !B2B_TURNOVER_RANGES.includes(annualTurnover)) {
    throw new AppError('Annual turnover range is required', 400)
  }
  if (companyType && !B2B_COMPANY_TYPES.includes(companyType)) {
    throw new AppError('Invalid business type', 400)
  }
  if (!acceptTerms && acceptTerms !== 'true' && acceptTerms !== true) {
    throw new AppError('You must accept B2B terms and conditions', 400)
  }

  const registrationCertificateUrl = uploadedFileUrl(req, 'registrationCertificate')
  const licenseDocumentUrl = uploadedFileUrl(req, 'licenseDocument')

  if (!registrationCertificateUrl) {
    throw new AppError('Company registration certificate (PDF) is required', 400)
  }
  if (!licenseDocumentUrl) {
    throw new AppError('Business license document (PDF) is required', 400)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    const existingProfile = await B2BProfile.findOne({ user: existingUser._id })
    if (existingProfile) {
      throw new AppError('A B2B application already exists for this email', 409)
    }
    throw new AppError('Email already registered. Log in and complete B2B verification.', 409)
  }

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: ROLES.CUSTOMER,
  })

  const manager = getAccountManagerById(preferredAccountManager)

  const profile = await B2BProfile.create({
    user: user._id,
    companyName: companyName.trim(),
    companyType: companyType || 'interior_designer',
    taxId: String(taxId).trim(),
    registrationNumber: String(registrationNumber).trim(),
    businessAddress: String(businessAddress).trim(),
    postalCode: String(postalCode).trim(),
    website: String(website || '').trim(),
    phone: String(phone).trim(),
    contactTitle: String(contactTitle || '').trim(),
    employeeCount: employeeCount || '',
    annualTurnover: annualTurnover || '',
    preferredAccountManager: preferredAccountManager || manager.id,
    message: String(message || '').trim(),
    registrationCertificateUrl,
    licenseDocumentUrl,
    status: 'pending',
    accountManager: manager,
    auditLog: [{ action: 'application_submitted', by: user._id, note: 'Initial B2B registration' }],
  })

  const token = await issueAuthSession(user, res)
  const publicProfile = profile.toPublicObject()

  emailB2BApplicationSubmitted({ user, profile: publicProfile })
  emailB2BApplicationReceived({ user, profile: publicProfile })

  res.status(201).json({
    success: true,
    message: 'B2B application submitted. Our team will review your documents within 1–2 business days.',
    token,
    user: user.toSafeObject(),
    profile: publicProfile,
  })
})
