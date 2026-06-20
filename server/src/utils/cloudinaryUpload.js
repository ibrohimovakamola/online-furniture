import { Readable } from 'stream'
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'
import { AppError } from './asyncHandler.js'

const DEFAULT_FOLDER = process.env.CLOUDINARY_GALLERY_FOLDER || 'mebel-gallery'

/**
 * Upload image buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {{ folder?: string, public_id?: string }} [options]
 */
export function uploadImageBuffer(buffer, options = {}) {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(new AppError('Cloudinary is not configured', 503))
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || DEFAULT_FOLDER,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) reject(new AppError(error.message || 'Cloudinary upload failed', 400))
        else resolve(result)
      }
    )

    Readable.from(buffer).pipe(uploadStream)
  })
}

export async function destroyCloudinaryImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return null
  if (publicId.startsWith('seed/') || publicId.startsWith('local/')) return null
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}
