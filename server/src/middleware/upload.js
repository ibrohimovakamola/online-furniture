import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const uploadsDir = path.join(__dirname, '../../uploads')

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

function isAllowedImage(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  return ALLOWED_IMAGE_MIMES.has(file.mimetype) && ALLOWED_IMAGE_EXTENSIONS.has(ext)
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safeExt = ALLOWED_IMAGE_EXTENSIONS.has(ext) ? ext : '.jpg'
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${safeExt}`)
  },
})

const imageFileFilter = (_req, file, cb) => {
  if (isAllowedImage(file)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG and PNG images are allowed (max 5MB)'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 10 },
})

export const productUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 8 },
])

export const categoryUpload = upload.single('image')

export const settingsUpload = upload.fields([{ name: 'bannerImage', maxCount: 1 }])

export const blogUpload = upload.single('featuredImage')

const memoryStorage = multer.memoryStorage()

export const galleryImageUpload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_BYTES },
}).single('image')

const documentFilter = (_req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, Word, or image files are allowed'), false)
  }
}

export const b2bDocumentUpload = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('licenseDocument')

/** B2B registration — company certificate + business license */
export const b2bRegistrationUpload = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
])
