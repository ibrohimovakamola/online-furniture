import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'
import { logApp } from '../utils/appLogger.js'
import { formatAddressField } from '../utils/authHelpers.js'

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '', trim: true, maxlength: 300 },
    city: { type: String, default: '', trim: true, maxlength: 120 },
    region: { type: String, default: '', trim: true, maxlength: 120 },
    postalCode: { type: String, default: '', trim: true, maxlength: 20 },
  },
  { _id: false }
)

const preferencesSchema = new mongoose.Schema(
  {
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
  },
  { _id: false }
)
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      match: [/^\+998\d{9}$/, 'Phone must be in +998XXXXXXXXX format'],
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    preferredLanguage: {
      type: String,
      enum: ['uz', 'ru', 'en'],
      default: 'uz',
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      select: false,
      default: null,
    },
    profileImage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: '{VALUE} is not a valid role',
      },
      default: ROLES.CUSTOMER,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** Set when a Super Admin creates a Manager/Admin account */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password
        delete ret.refreshTokens
        delete ret.emailVerificationToken
        delete ret.emailVerificationExpiry
        delete ret.passwordResetToken
        delete ret.passwordResetExpires
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

userSchema.index({ role: 1, isActive: 1 })
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string', $gt: '' } },
  }
)

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim()
})

userSchema.pre('save', function normalizePhone(next) {
  if (this.phone != null && String(this.phone).trim() === '') {
    this.phone = undefined
  }
  next()
})

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10
  this.password = await bcrypt.hash(this.password, rounds)
  next()
})

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!candidate || !this.password) return false

  const stored = String(this.password)
  if (!stored.startsWith('$2a$') && !stored.startsWith('$2b$') && !stored.startsWith('$2y$')) {
    logApp('error', '[auth] Stored password is not a valid bcrypt hash', { email: this.email })
    return false
  }

  try {
    return await bcrypt.compare(String(candidate), stored)
  } catch (err) {
    logApp('error', '[auth] bcrypt.compare failed', { message: err.message })
    return false
  }
}

userSchema.methods.toSafeObject = function toSafeObject() {
  const name = this.fullName || `${this.firstName} ${this.lastName}`.trim()
  const address = formatAddressField(this.address)
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    name,
    fullName: name,
    email: this.email,
    phone: this.phone || '',
    phoneNumber: this.phone || '',
    address,
    preferredLanguage: this.preferredLanguage || 'uz',
    isEmailVerified: Boolean(this.isEmailVerified),
    profileImage: this.profileImage || '',
    preferences: {
      newsletter: Boolean(this.preferences?.newsletter),
      notifications: this.preferences?.notifications !== false,
    },
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLoginAt,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export default mongoose.model('User', userSchema)
