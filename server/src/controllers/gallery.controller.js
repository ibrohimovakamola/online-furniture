import Gallery from '../models/Gallery.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parseCreateGallery, parseUpdateGallery } from '../validators/gallery.schema.js'
import { storeGalleryImage, removeGalleryImage } from '../utils/galleryImageStorage.js'
import { buildImageUrl } from '../utils/helpers.js'

export function formatGalleryItem(doc, req) {
  const item = doc.toObject ? doc.toObject() : doc
  let imageUrl = item.image?.url
  if (imageUrl && imageUrl.startsWith('/uploads/') && req) {
    imageUrl = buildImageUrl(imageUrl.replace(/^\/uploads\//, ''), req)
  }

  return {
    id: item._id,
    title: item.title,
    description: item.description,
    category: item.category,
    image: item.image
      ? {
          ...item.image,
          url: imageUrl || item.image.url,
        }
      : item.image,
    order: item.order,
    active: item.active,
    likes: item.likes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

/** GET /api/gallery */
export const listPublicGallery = asyncHandler(async (req, res) => {
  const query = { active: true }
  if (req.query.category) {
    query.category = String(req.query.category)
  }

  const items = await Gallery.find(query).sort({ order: 1, createdAt: -1 })
  res.json({
    success: true,
    items: items.map((doc) => formatGalleryItem(doc, req)),
  })
})

/** GET /api/admin/gallery */
export const listAdminGallery = asyncHandler(async (req, res) => {
  const items = await Gallery.find().sort({ order: 1, createdAt: -1 })
  res.json({
    success: true,
    items: items.map((doc) => formatGalleryItem(doc, req)),
  })
})

/** POST /api/admin/gallery/upload */
export const uploadGalleryItem = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    throw new AppError('Image file is required', 400)
  }

  const parsed = parseCreateGallery(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const data = parsed.data
  const stored = await storeGalleryImage(req.file.buffer, req.file.originalname, req)

  let order = data.order
  if (order == null) {
    const max = await Gallery.findOne().sort({ order: -1 }).select('order').lean()
    order = (max?.order ?? -1) + 1
  }

  const item = await Gallery.create({
    title: data.title,
    description: data.description || '',
    category: data.category,
    order,
    active: data.active ?? true,
    image: {
      url: stored.url,
      publicId: stored.publicId,
      alt: data.alt || data.title,
    },
  })

  res.status(201).json({
    success: true,
    item: formatGalleryItem(item, req),
  })
})

/** PUT /api/admin/gallery/:id */
export const updateGalleryItem = asyncHandler(async (req, res) => {
  const parsed = parseUpdateGallery(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const existing = await Gallery.findById(req.params.id)
  if (!existing) throw new AppError('Gallery item not found', 404)

  const patch = { ...parsed.data }

  if (patch.alt !== undefined) {
    existing.image.alt = patch.alt || existing.title
    delete patch.alt
  }

  Object.assign(existing, patch)
  await existing.save()

  res.json({
    success: true,
    item: formatGalleryItem(existing, req),
  })
})

/** PUT /api/admin/gallery/:id/image */
export const replaceGalleryImage = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    throw new AppError('Image file is required', 400)
  }

  const existing = await Gallery.findById(req.params.id)
  if (!existing) throw new AppError('Gallery item not found', 404)

  const stored = await storeGalleryImage(req.file.buffer, req.file.originalname, req)
  await removeGalleryImage(existing.image.publicId)

  existing.image = {
    url: stored.url,
    publicId: stored.publicId,
    alt: req.body.alt?.trim() || existing.image.alt || existing.title,
  }
  await existing.save()

  res.json({
    success: true,
    item: formatGalleryItem(existing, req),
  })
})

/** DELETE /api/admin/gallery/:id */
export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id)
  if (!item) throw new AppError('Gallery item not found', 404)

  await removeGalleryImage(item.image.publicId)
  await item.deleteOne()

  res.json({ success: true, message: 'Gallery item deleted' })
})
