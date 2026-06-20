import Review from '../models/Review.js'
import Product from '../models/Product.js'

const APPROVED = { status: 'approved' }

export async function getReviewStats(productId) {
  const rows = await Review.aggregate([
    { $match: { product: productId, ...APPROVED } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ])

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  let sum = 0

  for (const row of rows) {
    const stars = Number(row._id)
    if (stars >= 1 && stars <= 5) {
      distribution[stars] = row.count
      total += row.count
      sum += stars * row.count
    }
  }

  const average_rating = total ? Math.round((sum / total) * 10) / 10 : 0

  return {
    average_rating,
    total,
    distribution,
  }
}

/** Recalculate and persist Product.rating + Product.reviews_count from approved reviews. */
export async function syncProductReviewStats(productId) {
  const stats = await getReviewStats(productId)
  await Product.findByIdAndUpdate(productId, {
    rating: stats.average_rating,
    reviews_count: stats.total,
  })
  return stats
}

export function formatAuthorName(user) {
  if (!user) return 'Anonymous'
  const first = user.firstName || ''
  const lastInitial = user.lastName?.[0] ? `${user.lastName[0]}.` : ''
  const name = `${first} ${lastInitial}`.trim()
  return name || user.email?.split('@')[0] || 'Customer'
}

export function formatPublicReview(review, user) {
  const doc = review.toObject ? review.toObject() : review
  const authorUser = user || doc.user
  return {
    id: String(doc._id),
    productId: String(doc.product),
    rating: doc.rating,
    title: doc.title || '',
    comment: doc.comment,
    author: formatAuthorName(authorUser),
    verified_purchase: Boolean(doc.verified_purchase),
    helpful_count: doc.helpful_count || 0,
    images: doc.images || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
