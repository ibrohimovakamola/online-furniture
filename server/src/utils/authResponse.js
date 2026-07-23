/**
 * Standard auth API responses.
 * Includes legacy top-level `token` / `user` for existing React client.
 */
export function formatAuthUser(user) {
  const safe = user.toSafeObject ? user.toSafeObject() : user
  return {
    id: safe.id,
    email: safe.email,
    name: safe.name || safe.fullName || `${safe.firstName || ''} ${safe.lastName || ''}`.trim(),
    firstName: safe.firstName,
    lastName: safe.lastName,
    phone: safe.phone || '',
    phoneNumber: safe.phoneNumber || safe.phone || '',
    address: safe.address || { street: '', city: '', region: '', postalCode: '' },
    preferredLanguage: safe.preferredLanguage || 'uz',
    isEmailVerified: safe.isEmailVerified !== false,
    profileImage: safe.profileImage || '',
    preferences: safe.preferences || { newsletter: false, notifications: true },
    role: safe.role,
    isActive: safe.isActive,
    lastLogin: safe.lastLogin || safe.lastLoginAt,
    createdAt: safe.createdAt,
    updatedAt: safe.updatedAt,
  }
}

export function sendAuthSuccess(res, { user, token, message, status = 200 }) {
  const userPayload = formatAuthUser(user)
  const body = {
    success: true,
    message,
    data: {
      user: userPayload,
      token,
    },
    // Legacy fields — storefront authSlice reads these directly
    token,
    user: userPayload,
  }

  res.status(status).json(body)
}

export function sendUserSuccess(res, { user, message, status = 200 }) {
  const userPayload = formatAuthUser(user)
  res.status(status).json({
    success: true,
    message,
    data: { user: userPayload },
    user: userPayload,
  })
}

/** Split "John Doe" → { firstName, lastName } */
export function parseDisplayName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    return { firstName: 'User', lastName: 'User' }
  }
  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
  }
}
