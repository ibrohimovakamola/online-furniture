import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { uploadsDir } from '../middleware/upload.js'
import { buildImageUrl } from './helpers.js'
import { uploadImageBuffer, destroyCloudinaryImage } from './cloudinaryUpload.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'
import { logApp } from './appLogger.js'

const galleryDir = path.join(uploadsDir, 'gallery')

function ensureGalleryDir() {
  if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true })
  }
}

function saveLocalGalleryBuffer(buffer, originalName) {
  ensureGalleryDir()
  const ext = path.extname(originalName || '').toLowerCase()
  const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.jpg'
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`
  const filepath = path.join(galleryDir, filename)
  fs.writeFileSync(filepath, buffer)
  return {
    storageKey: `gallery/${filename}`,
    publicId: `local/gallery/${filename}`,
  }
}

function deleteLocalGalleryImage(publicId) {
  if (!publicId?.startsWith('local/gallery/')) return
  const filename = publicId.replace('local/gallery/', '')
  const filepath = path.join(galleryDir, filename)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
}

/**
 * Upload gallery image — Cloudinary when configured, else local disk (dev/VPS).
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function storeGalleryImage(buffer, originalName, req) {
  if (isCloudinaryConfigured()) {
    const result = await uploadImageBuffer(buffer)
    return {
      url: result.secure_url,
      publicId: result.public_id,
    }
  }

  const { storageKey, publicId } = saveLocalGalleryBuffer(buffer, originalName)
  const url = buildImageUrl(storageKey, req)

  if (process.env.NODE_ENV !== 'production') {
    logApp('info', '[gallery] Saved locally (Cloudinary not configured)', { publicId })
  }

  return { url, publicId }
}

/** Remove gallery image from Cloudinary or local disk. */
export async function removeGalleryImage(publicId) {
  if (!publicId) return
  if (publicId.startsWith('local/')) {
    deleteLocalGalleryImage(publicId)
    return
  }
  await destroyCloudinaryImage(publicId)
}

export function getGalleryStorageMode() {
  return isCloudinaryConfigured() ? 'cloudinary' : 'local'
}
