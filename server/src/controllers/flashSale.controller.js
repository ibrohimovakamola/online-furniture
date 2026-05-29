import Product from '../models/Product.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { getOrCreateSettings, formatSettings, isFlashSaleActive } from '../utils/settingsHelper.js'
import { formatAdminProduct, formatStoreProduct } from '../utils/productFormatter.js'
import { resolveProductFlashSale } from '../utils/flashSaleHelper.js'

function formatFlashConfig(settingsDoc) {
  const fs = settingsDoc.flashSale || {}
  return {
    enabled: Boolean(fs.enabled),
    showOnHomepage: fs.showOnHomepage !== false,
    endsAt: fs.endsAt || null,
    title: fs.title || 'Flash Sales',
    isActive: isFlashSaleActive(fs),
  }
}

/** GET /api/admin/flash-sale */
export const getAdminFlashSale = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  const products = await Product.find({ isPublished: true })
    .populate('category', 'name slug')
    .sort({ name: 1 })

  res.json({
    success: true,
    config: formatFlashConfig(settings),
    products: products.map((p) => {
      const admin = formatAdminProduct(p, req)
      const flash = resolveProductFlashSale(p, settings.flashSale)
      return {
        ...admin,
        isFlashSale: Boolean(p.isFlashSale),
        flashSaleDiscountPercent: p.flashSaleDiscountPercent || 0,
        flashSalePrice: flash.flashSalePrice,
      }
    }),
  })
})

/** PUT /api/admin/flash-sale/config */
export const updateFlashSaleConfig = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  const { enabled, showOnHomepage, endsAt, title } = req.body

  if (enabled !== undefined) settings.flashSale.enabled = Boolean(enabled)
  if (showOnHomepage !== undefined) settings.flashSale.showOnHomepage = Boolean(showOnHomepage)
  if (title !== undefined) settings.flashSale.title = String(title).trim() || 'Flash Sales'
  if (endsAt !== undefined) {
    settings.flashSale.endsAt = endsAt ? new Date(endsAt) : null
    if (endsAt && Number.isNaN(settings.flashSale.endsAt.getTime())) {
      throw new AppError('Invalid flash sale end date', 400)
    }
  }

  settings.markModified('flashSale')
  await settings.save()

  res.json({
    success: true,
    message: 'Flash sale settings saved',
    config: formatFlashConfig(settings),
    settings: formatSettings(settings, req),
  })
})

/** PUT /api/admin/flash-sale/products */
export const updateFlashSaleProducts = asyncHandler(async (req, res) => {
  const items = req.body.products
  if (!Array.isArray(items)) throw new AppError('products array is required', 400)

  const settings = await getOrCreateSettings()

  for (const item of items) {
    if (!item?.id) continue
    const product = await Product.findById(item.id)
    if (!product) continue

    if (item.isFlashSale !== undefined) product.isFlashSale = Boolean(item.isFlashSale)
    if (item.flashSaleDiscountPercent !== undefined) {
      product.flashSaleDiscountPercent = Math.min(
        100,
        Math.max(0, Number(item.flashSaleDiscountPercent) || 0)
      )
    }
    if (item.flashSaleEndsAt !== undefined) {
      product.flashSaleEndsAt = item.flashSaleEndsAt ? new Date(item.flashSaleEndsAt) : null
    }

    await product.save()
  }

  const products = await Product.find({ isPublished: true })
    .populate('category', 'name slug')
    .sort({ name: 1 })

  res.json({
    success: true,
    message: 'Flash sale products updated',
    config: formatFlashConfig(settings),
    products: products.map((p) => {
      const admin = formatAdminProduct(p, req)
      const flash = resolveProductFlashSale(p, settings.flashSale)
      return {
        ...admin,
        isFlashSale: Boolean(p.isFlashSale),
        flashSaleDiscountPercent: p.flashSaleDiscountPercent || 0,
        flashSalePrice: flash.flashSalePrice,
      }
    }),
  })
})

/** GET /api/store/flash-sale — public */
export const getStoreFlashSale = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings()
  const config = formatFlashConfig(settings)

  if (!config.isActive) {
    return res.json({
      success: true,
      config: { ...config, enabled: false },
      products: [],
    })
  }

  const products = await Product.find({ isPublished: true, isFlashSale: true })
    .populate('category', 'name slug')
    .sort({ updatedAt: -1 })

  const activeProducts = products
    .map((p) => {
      const flash = resolveProductFlashSale(p, settings.flashSale)
      if (!flash.isFlashSale) return null
      const formatted = formatStoreProduct(p, req)
      return {
        ...formatted,
        isFlashSale: true,
        flashSaleDiscountPercent: flash.flashSaleDiscountPercent,
        flashSalePrice: flash.flashSalePrice,
        price: flash.flashSalePrice ?? formatted.price,
        discountedPrice: flash.flashSalePrice,
        discountPercentage: flash.flashSaleDiscountPercent,
      }
    })
    .filter(Boolean)

  res.json({
    success: true,
    config,
    products: activeProducts,
  })
})
