import Gallery from '../models/Gallery.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parseCreateGallery, parseUpdateGallery } from '../validators/gallery.schema.js'
import { uploadImageBuffer, destroyCloudinaryImage } from '../utils/cloudinaryUpload.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'

export function formatGalleryItem(doc) {
  const item = doc.toObject ? doc.toObject() : doc
  return {
    id: item._id,
    title: item.title,
    description: item.description,
    category: item.category,
    image: item.image,
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
    items: items.map(formatGalleryItem),
  })
})

/** GET /api/admin/gallery */
export const listAdminGallery = asyncHandler(async (_req, res) => {
  const items = await Gallery.find().sort({ order: 1, createdAt: -1 })
  res.json({
    success: true,
    items: items.map(formatGalleryItem),
  })
})

/** POST /api/admin/gallery/upload — create with Cloudinary image */
export const uploadGalleryItem = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Cloudinary is not configured', 503)
  }
  if (!req.file?.buffer) {
    throw new AppError('Image file is required', 400)
  }

  const parsed = parseCreateGallery(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join('; ')
    throw new AppError(message, 400)
  }

  const data = parsed.data
  const result = await uploadImageBuffer(req.file.buffer)

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
      url: result.secure_url,
      publicId: result.public_id,
      alt: data.alt || data.title,
    },
  })

  res.status(201).json({
    success: true,
    item: formatGalleryItem(item),
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
    item: formatGalleryItem(existing),
  })
})

/** PUT /api/admin/gallery/:id/image — replace image on Cloudinary */
export const replaceGalleryImage = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Cloudinary is not configured', 503)
  }
  if (!req.file?.buffer) {
    throw new AppError('Image file is required', 400)
  }

  const existing = await Gallery.findById(req.params.id)
  if (!existing) throw new AppError('Gallery item not found', 404)

  const result = await uploadImageBuffer(req.file.buffer)
  await destroyCloudinaryImage(existing.image.publicId)

  existing.image = {
    url: result.secure_url,
    publicId: result.public_id,
    alt: req.body.alt?.trim() || existing.image.alt || existing.title,
  }
  await existing.save()

  res.json({
    success: true,
    item: formatGalleryItem(existing),
  })
})

/** DELETE /api/admin/gallery/:id */
export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id)
  if (!item) throw new AppError('Gallery item not found', 404)

  await destroyCloudinaryImage(item.image.publicId)
  await item.deleteOne()

  res.json({ success: true, message: 'Gallery item deleted' })
})
