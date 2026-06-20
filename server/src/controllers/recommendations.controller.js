import { asyncHandler } from '../utils/asyncHandler.js'
import { resolveLang } from '../utils/catalogFormatter.js'
import {
  getTrendingProducts,
  getBestsellerProducts,
  getSimilarProducts,
  getUserRecommendations,
} from '../utils/productSearch.js'

/** GET /api/products/:productId/recommendations */
export const getProductRecommendations = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20)
  const products = await getSimilarProducts(req.params.productId || req.params.id, {
    limit,
    lang,
    req,
  })

  res.json({
    success: true,
    data: { products, total: products.length },
  })
})

/** GET /api/products/trending */
export const getTrending = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20)
  const products = await getTrendingProducts({ limit, lang, req })

  res.json({
    success: true,
    data: { products, total: products.length },
  })
})

/** GET /api/products/bestsellers */
export const getBestsellers = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20)
  const products = await getBestsellerProducts({ limit, lang, req })

  res.json({
    success: true,
    data: { products, total: products.length },
  })
})

/** GET /api/recommendations/user/:userId */
export const getUserProductRecommendations = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20)
  const products = await getUserRecommendations(req.params.userId, { limit, lang, req })

  res.json({
    success: true,
    data: { products, total: products.length },
  })
})
