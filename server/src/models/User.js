import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'
import { logApp } from '../utils/appLogger.js'

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
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
      default: '',
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
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
      transform(_doc, ret) {
        delete ret.password
        delete ret.refreshTokens
        return ret
      },
    },
  }
)

userSchema.index({ role: 1, isActive: 1 })

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
  const name = `${this.firstName} ${this.lastName}`.trim()
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    name,
    email: this.email,
    phone: this.phone || '',
    address: this.address || '',
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export default mongoose.model('User', userSchema)
