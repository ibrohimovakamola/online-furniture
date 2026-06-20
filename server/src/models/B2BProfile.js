import mongoose from 'mongoose'
import {
  B2B_STATUSES,
  B2B_COMPANY_TYPES,
  B2B_CREDIT_TERMS,
  B2B_TURNOVER_RANGES,
  B2B_EMPLOYEE_RANGES,
} from '../config/b2b.js'

const accountManagerSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: 'B2B Account Manager' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    responseGuaranteeHours: { type: Number, default: 2 },
  },
  { _id: false }
)

const b2bProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
    companyType: {
      type: String,
      enum: B2B_COMPANY_TYPES,
      default: 'interior_designer',
    },
    taxId: { type: String, trim: true, default: '' }, // STIR
    registrationNumber: { type: String, trim: true, default: '' }, // INN
    businessAddress: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    contactTitle: { type: String, trim: true, default: '' },
    employeeCount: { type: String, enum: [...B2B_EMPLOYEE_RANGES, ''], default: '' },
    annualTurnover: { type: String, enum: [...B2B_TURNOVER_RANGES, ''], default: '' },
    preferredAccountManager: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '', maxlength: 2000 },
    registrationCertificateUrl: { type: String, default: null },
    licenseDocumentUrl: { type: String, default: null },
    status: {
      type: String,
      enum: B2B_STATUSES,
      default: 'pending',
      index: true,
    },
    verificationNotes: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedReason: { type: String, default: '' },
    creditTerms: {
      type: String,
      enum: B2B_CREDIT_TERMS,
      default: 'prepay',
    },
    creditLimit: { type: Number, default: 0, min: 0 },
    accountBalance: { type: Number, default: 0 },
    tier: { type: String, enum: ['standard', 'premium'], default: 'standard' },
    accountManager: { type: accountManagerSchema, default: () => ({}) },
    teamMembers: [
      {
        email: { type: String, trim: true, lowercase: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        role: { type: String, enum: ['buyer', 'viewer', 'admin'], default: 'buyer' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      emailNotifications: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promoAlerts: { type: Boolean, default: true },
      currency: { type: String, default: 'UZS' },
    },
    auditLog: [
      {
        action: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

b2bProfileSchema.index({ status: 1, createdAt: -1 })
b2bProfileSchema.index({ companyName: 'text', taxId: 'text' })

b2bProfileSchema.methods.toPublicObject = function toPublicObject() {
  const doc = this.toObject()
  return {
    id: doc._id,
    userId: doc.user,
    companyName: doc.companyName,
    companyType: doc.companyType,
    taxId: doc.taxId,
    registrationNumber: doc.registrationNumber,
    businessAddress: doc.businessAddress,
    postalCode: doc.postalCode,
    website: doc.website,
    phone: doc.phone,
    contactTitle: doc.contactTitle,
    employeeCount: doc.employeeCount,
    annualTurnover: doc.annualTurnover,
    preferredAccountManager: doc.preferredAccountManager,
    message: doc.message,
    registrationCertificateUrl: doc.registrationCertificateUrl,
    licenseDocumentUrl: doc.licenseDocumentUrl,
    status: doc.status,
    verificationNotes: doc.verificationNotes,
    rejectedReason: doc.rejectedReason,
    verifiedAt: doc.verifiedAt,
    creditTerms: doc.creditTerms,
    creditLimit: doc.creditLimit,
    accountBalance: doc.accountBalance,
    tier: doc.tier,
    accountManager: doc.accountManager,
    teamMembers: doc.teamMembers,
    settings: doc.settings,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export default mongoose.model('B2BProfile', b2bProfileSchema)
