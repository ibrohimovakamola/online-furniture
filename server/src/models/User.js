import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'

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
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password
        return ret
      },
    },
  }
)

userSchema.index({ role: 1, isActive: 1 })

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!candidate || !this.password) return false

  const stored = String(this.password)
  if (!stored.startsWith('$2a$') && !stored.startsWith('$2b$') && !stored.startsWith('$2y$')) {
    console.error('[auth] Stored password is not a valid bcrypt hash for user:', this.email)
    return false
  }

  try {
    return await bcrypt.compare(String(candidate), stored)
  } catch (err) {
    console.error('[auth] bcrypt.compare failed:', err.message)
    return false
  }
}

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export default mongoose.model('User', userSchema)
