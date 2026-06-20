import mongoose from 'mongoose'
import Review from '../models/Review.js'
import ReviewHelpful from '../models/ReviewHelpful.js'
import Product from '../models/Product.js'
import { ADMIN_ROLES } from '../config/roles.js'
import { AppError, asyncHandler } from '../utils/asyncHandler.js'
import { parsePagination } from '../utils/pagination.js'
import { userPurchasedProduct } from '../utils/verifiedPurchase.js'
import {
  formatPublicReview,
  getReviewStats,
  syncProductReviewStats,
} from '../utils/reviewStats.js'
import { logAdminAction } from '../utils/adminActionLog.js'
import { buildSearchRegex } from '../utils/safeRegex.js'
import { logReviewPosted } from '../utils/activityLogger.js'

function resolveProductId(req) {
  return req.params.productId || req.params.id
}

function parseReviewSort(sort) {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 }
    case 'rating_high':
      return { rating: -1, createdAt: -1 }
    case 'rating_low':
      return { rating: 1, createdAt: -1 }
    case 'helpful':
      return { helpful_count: -1, createdAt: -1 }
    case 'newest':
    default:
      return { createdAt: -1 }
  }
}

function parseAdminReviewSort(sort) {
  switch (sort) {
    case 'rating':
      return { rating: -1, createdAt: -1 }
    case 'helpful':
      return { helpful_count: -1, createdAt: -1 }
    case 'newest':
    case 'date':
    default:
      return { createdAt: -1 }
  }
}

async function assertProductExists(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product id', 400)
  }
  const product = await Product.findById(productId).select('_id')
  if (!product) throw new AppError('Product not found', 404)
  return product
}

function isAdmin(user) {
  return user && ADMIN_ROLES.includes(user.role)
}

/** GET /api/products/:productId/reviews */
export const listProductReviews = asyncHandler(async (req, res) => {
  const productId = resolveProductId(req)
  await assertProductExists(productId)

  const q = req.validated || req.query
  const { limit, page, skip } = parsePagination(q, { defaultLimit: 10, maxLimit: 50 })
  const filter = { product: productId, status: 'approved' }
  if (q.rating) filter.rating = q.rating

  const [reviews, total, stats] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName')
      .sort(parseReviewSort(q.sort))
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
    getReviewStats(productId),
  ])

  res.json({
    success: true,
    data: {
      reviews: reviews.map((r) => formatPublicReview(r, r.user)),
      total,
      page,
      limit,
      stats: {
        average_rating: stats.average_rating,
        distribution: stats.distribution,
      },
    },
  })
})

/** GET /api/products/:productId/reviews/stats */
export const getProductReviewStats = asyncHandler(async (req, res) => {
  const productId = resolveProductId(req)
  await assertProductExists(productId)

  const stats = await getReviewStats(productId)

  res.json({
    success: true,
    data: {
      average_rating: stats.average_rating,
      total: stats.total,
      distribution: stats.distribution,
    },
  })
})

/** POST /api/reviews */
export const createReview = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const { productId, rating, title, comment, images } = body

  await assertProductExists(productId)

  const purchased = await userPurchasedProduct(req.user._id, productId)
  if (!purchased) {
    throw new AppError('You can only review products you have purchased', 403)
  }

  const existing = await Review.findOne({ product: productId, user: req.user._id })
  if (existing) {
    throw new AppError('You have already reviewed this product', 409)
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title: title || '',
    comment,
    images: images || [],
    verified_purchase: true,
    status: 'pending',
  })

  await review.populate('user', 'firstName lastName email')

  logReviewPosted(review, req)

  res.status(201).json({
    success: true,
    message: 'Review submitted and pending moderation',
    data: { review: formatPublicReview(review, review.user) },
  })
})

/** PUT /api/reviews/:reviewId */
export const updateReview = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const review = await Review.findById(req.params.reviewId)
  if (!review) throw new AppError('Review not found', 404)

  if (String(review.user) !== String(req.user._id)) {
    throw new AppError('You can only edit your own review', 403)
  }

  const purchased = await userPurchasedProduct(req.user._id, review.product)
  if (!purchased) {
    throw new AppError('Verified purchase required to update this review', 403)
  }

  if (body.rating != null) review.rating = body.rating
  if (body.title !== undefined) review.title = body.title
  if (body.comment !== undefined) review.comment = body.comment
  if (body.images !== undefined) review.images = body.images

  review.verified_purchase = true
  const wasApproved = review.status === 'approved'
  if (wasApproved) {
    review.status = 'pending'
  }

  await review.save()
  await review.populate('user', 'firstName lastName email')

  if (wasApproved) {
    await syncProductReviewStats(review.product)
  }

  res.json({
    success: true,
    message: 'Review updated',
    data: { review: formatPublicReview(review, review.user) },
  })
})

/** DELETE /api/reviews/:reviewId */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId)
  if (!review) throw new AppError('Review not found', 404)

  const ownsReview = String(review.user) === String(req.user._id)
  if (!ownsReview && !isAdmin(req.user)) {
    throw new AppError('You can only delete your own review', 403)
  }

  const productId = review.product
  await ReviewHelpful.deleteMany({ review: review._id })
  await review.deleteOne()

  await syncProductReviewStats(productId)

  res.json({ success: true, message: 'Review deleted' })
})

/** POST /api/reviews/:reviewId/helpful */
export const markReviewHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.reviewId,
    status: 'approved',
  })
  if (!review) throw new AppError('Review not found', 404)

  try {
    await ReviewHelpful.create({ review: review._id, user: req.user._id })
    review.helpful_count += 1
    await review.save()
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You already marked this review as helpful', 409)
    }
    throw err
  }

  res.json({
    success: true,
    data: { helpful_count: review.helpful_count },
  })
})

/** GET /api/admin/reviews */
export const listAdminReviews = asyncHandler(async (req, res) => {
  const q = req.validated || req.query
  const { limit, page, skip } = parsePagination(q)
  const filter = {}

  if (q.status) filter.status = q.status
  if (q.productId) filter.product = q.productId
  if (q.search?.trim()) {
    const regex = buildSearchRegex(q.search)
    if (regex) {
      filter.$or = [{ title: regex }, { comment: regex }]
    }
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name name_uz sku')
      .sort(parseAdminReviewSort(q.sort))
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: {
      items: reviews.map((r) => ({
        ...formatPublicReview(r, r.user),
        status: r.status,
        product: r.product
          ? {
              id: String(r.product._id),
              name: r.product.name_uz || r.product.name,
              sku: r.product.sku,
            }
          : null,
        userId: String(r.user?._id || r.user),
        userEmail: r.user?.email,
      })),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  })
})

/** PUT /api/admin/reviews/:reviewId/approve */
export const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId)
  if (!review) throw new AppError('Review not found', 404)

  review.status = 'approved'
  review.moderatedBy = req.user._id
  review.moderatedAt = new Date()
  await review.save()
  await review.populate('user', 'firstName lastName email')

  const stats = await syncProductReviewStats(review.product)

  logAdminAction(req, 'review.approve', { reviewId: String(review._id) })

  res.json({
    success: true,
    message: 'Review approved',
    data: {
      review: formatPublicReview(review, review.user),
      stats: {
        average_rating: stats.average_rating,
        distribution: stats.distribution,
      },
    },
  })
})

/** DELETE /api/admin/reviews/:reviewId */
export const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId)
  if (!review) throw new AppError('Review not found', 404)

  const productId = review.product
  await ReviewHelpful.deleteMany({ review: review._id })
  await review.deleteOne()

  const stats = await syncProductReviewStats(productId)

  logAdminAction(req, 'review.delete', { reviewId: String(req.params.reviewId) })

  res.json({
    success: true,
    message: 'Review removed',
    data: {
      stats: {
        average_rating: stats.average_rating,
        distribution: stats.distribution,
      },
    },
  })
})
