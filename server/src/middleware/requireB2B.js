import { AppError } from '../utils/asyncHandler.js'
import { requireVerifiedB2BProfile, getB2BProfileForUser } from '../utils/b2bHelpers.js'

/** Attach B2B profile; block if not verified (for catalog/orders). */
export async function requireB2BVerified(req, _res, next) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401)
    req.b2bProfile = await requireVerifiedB2BProfile(req.user._id)
    next()
  } catch (err) {
    next(err)
  }
}

/** Attach B2B profile if exists; does not require verification. */
export async function attachB2BProfile(req, _res, next) {
  try {
    if (req.user) {
      req.b2bProfile = await getB2BProfileForUser(req.user._id)
    }
    next()
  } catch (err) {
    next(err)
  }
}
