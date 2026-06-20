import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getOrCreateSettings,
  formatSettings,
  clearSettingsCache,
  DEFAULT_SETTINGS,
} from '../utils/settingsHelper.js'

function applyStoreFields(settings, body) {
  if (body.supportPhone !== undefined) settings.store.supportPhone = String(body.supportPhone).trim()
  if (body.storeEmail !== undefined) settings.store.storeEmail = String(body.storeEmail).trim()
  if (body.address !== undefined) settings.store.address = String(body.address).trim()
  if (body.telegram !== undefined) settings.store.telegram = String(body.telegram).trim()
  if (body.instagram !== undefined) settings.store.instagram = String(body.instagram).trim()
}

function applyBannerFields(settings, body, files) {
  if (body.eyebrow !== undefined) settings.banner.eyebrow = String(body.eyebrow).trim()
  if (body.title !== undefined) settings.banner.title = String(body.title).trim()
  if (body.discountPercent !== undefined) {
    settings.banner.discountPercent = Math.min(100, Math.max(0, Number(body.discountPercent) || 0))
  }
  if (body.ctaText !== undefined) settings.banner.ctaText = String(body.ctaText).trim()
  if (body.ctaLink !== undefined) settings.banner.ctaLink = String(body.ctaLink).trim()

  const bannerFile = files?.bannerImage?.[0]
  if (bannerFile?.filename) {
    settings.banner.backgroundImage = bannerFile.filename
  }
}

function applyShippingFields(settings, body) {
  if (body.defaultShippingFee !== undefined) {
    settings.shipping.defaultShippingFee = Math.max(0, Number(body.defaultShippingFee) || 0)
  }
  if (body.freeShippingThreshold !== undefined) {
    settings.shipping.freeShippingThreshold = Math.max(0, Number(body.freeShippingThreshold) || 0)
  }
}

/** GET /api/admin/settings */
export const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  res.json({ success: true, settings: formatSettings(settings, req) })
})

/** PUT /api/admin/settings — partial update (multipart for banner image) */
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  const section = req.body.section || 'all'

  if (section === 'store' || section === 'all') applyStoreFields(settings, req.body)
  if (section === 'banner' || section === 'all') applyBannerFields(settings, req.body, req.files)
  if (section === 'shipping' || section === 'all') applyShippingFields(settings, req.body)

  settings.markModified('store')
  settings.markModified('banner')
  settings.markModified('shipping')
  await settings.save()
  clearSettingsCache()

  res.json({
    success: true,
    message: 'Settings saved successfully',
    settings: formatSettings(settings, req),
  })
})

/** GET /api/store/settings — public storefront */
export const getStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  res.json({ success: true, settings: formatSettings(settings, req) })
})

export { DEFAULT_SETTINGS }
