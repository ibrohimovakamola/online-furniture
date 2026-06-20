import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
const apiKey = process.env.CLOUDINARY_API_KEY || ''
const apiSecret = process.env.CLOUDINARY_API_SECRET || ''

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function isCloudinaryConfigured() {
  return Boolean(cloudName && apiKey && apiSecret)
}

export function getCloudinaryStatus() {
  return {
    configured: isCloudinaryConfigured(),
    cloudName: cloudName ? '[set]' : '[missing]',
    folder: process.env.CLOUDINARY_GALLERY_FOLDER || 'mebel-gallery',
  }
}

export { cloudinary }
