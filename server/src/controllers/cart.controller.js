import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { AppError, Errors, asyncHandler } from '../utils/asyncHandler.js'
import { buildImageUrl } from '../utils/helpers.js'
import { pickLocalizedField } from '../utils/localize.js'
import { resolveLang } from '../utils/catalogFormatter.js'
import { logCartAdd } from '../utils/activityLogger.js'

function resolveUnitPrice(product) {
  return product.discountedPrice ?? product.price ?? product.basePrice ?? 0
}

/** Load or create empty cart for the current user */
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] })
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select:
        'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
    })
  }

  return cart
}

function formatCartItem(item, req, lang = 'uz') {
  const product = item.product
  if (!product || product.isPublished === false || product.isActive === false) {
    return null
  }

  const price = item.price_at_purchase ?? resolveUnitPrice(product)

  return {
    id: String(item._id),
    productId: String(product._id),
    name: pickLocalizedField(product, 'name', lang),
    slug: product.slug,
    sku: product.sku,
    quantity: item.quantity,
    color: item.color || '',
    price_at_purchase: price,
    unitPrice: price,
    lineTotal: price * item.quantity,
    stock: product.stock,
    addedAt: item.addedAt,
    image: product.mainImage ? buildImageUrl(product.mainImage.replace(/^\/uploads\//, ''), req) : null,
  }
}

function formatCart(cart, req, lang = 'uz') {
  const lines = cart.items.map((item) => formatCartItem(item, req, lang)).filter(Boolean)
  const totalPrice = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  return {
    id: String(cart._id),
    userId: String(cart.user),
    items: lines,
    itemCount: lines.reduce((n, line) => n + line.quantity, 0),
    totalPrice,
    updatedAt: cart.updatedAt,
    createdAt: cart.createdAt,
  }
}

/** GET /api/cart */
export const getCart = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const cart = await getOrCreateCart(req.user._id)
  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** POST /api/cart — add item */
export const addCartItem = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const productId = body.productId
  const quantity = Math.max(1, Number(body.quantity) || 1)
  const color = String(body.color || '').trim()
  const lang = resolveLang(req)

  const product = await Product.findById(productId).select(
    '_id name basePrice price discountedPrice isPublished isActive stock'
  )
  if (!product?.isPublished || product.isActive === false) {
    throw new AppError('Product not found or unavailable', 404)
  }
  if (product.stock < 1) {
    throw new AppError('Product is out of stock', 400)
  }

  const cart = await getOrCreateCart(req.user._id)
  const existing = cart.items.find(
    (item) =>
      String(item.product?._id || item.product) === String(productId) && item.color === color
  )

  const newQty = (existing?.quantity || 0) + quantity
  if (newQty > product.stock) {
    throw Errors.insufficientStock()
  }

  const priceAtPurchase = resolveUnitPrice(product)

  if (existing) {
    existing.quantity = newQty
    existing.price_at_purchase = priceAtPurchase
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      color,
      price_at_purchase: priceAtPurchase,
      addedAt: new Date(),
    })
  }

  await cart.save()
  await cart.populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  logCartAdd(product._id, req, { quantity: newQty, color })

  res.status(201).json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** PUT /api/cart/item/:productId — update quantity */
export const updateCartItemByProduct = asyncHandler(async (req, res) => {
  const body = req.validated || req.body
  const quantity = Number(body.quantity)
  const productId = req.params.productId
  const color = String(req.query.color || '').trim()
  const lang = resolveLang(req)

  const cart = await getOrCreateCart(req.user._id)
  const item = cart.items.find(
    (row) =>
      String(row.product?._id || row.product) === String(productId) &&
      (row.color || '') === color
  )

  if (!item) throw new AppError('Product not in cart', 404)

  const product = await Product.findById(productId).select('stock isPublished isActive basePrice price discountedPrice')
  if (!product?.isPublished || product.isActive === false) {
    throw new AppError('Product no longer available', 400)
  }
  if (quantity > product.stock) {
    throw Errors.insufficientStock()
  }

  item.quantity = quantity
  item.price_at_purchase = resolveUnitPrice(product)
  await cart.save()
  await cart.populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** DELETE /api/cart/item/:productId */
export const removeCartItemByProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId
  const color = String(req.query.color || '').trim()
  const lang = resolveLang(req)

  const cart = await getOrCreateCart(req.user._id)
  const before = cart.items.length
  cart.items = cart.items.filter(
    (row) =>
      !(
        String(row.product?._id || row.product) === String(productId) &&
        (row.color || '') === color
      )
  )

  if (cart.items.length === before) {
    throw new AppError('Product not in cart', 404)
  }

  await cart.save()
  await cart.populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** DELETE /api/cart */
export const clearCart = asyncHandler(async (req, res) => {
  const lang = resolveLang(req)
  const cart = await getOrCreateCart(req.user._id)
  cart.items = []
  await cart.save()

  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** Legacy: PUT /api/cart — replace entire cart */
export const replaceCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body
  const lang = resolveLang(req)

  if (!Array.isArray(items)) {
    throw new AppError('items must be an array', 400)
  }

  const normalized = []
  for (const row of items) {
    const productId = row.productId || row.product
    const quantity = Number(row.quantity) || 1

    if (!productId || quantity < 1) continue

    const product = await Product.findById(productId).select(
      '_id isPublished isActive stock basePrice price discountedPrice'
    )
    if (!product?.isPublished || product.isActive === false) {
      throw new AppError(`Product not available: ${productId}`, 400)
    }
    if (product.stock > 0 && quantity > product.stock) {
      throw Errors.insufficientStock(`Insufficient stock for product ${productId}`)
    }

    normalized.push({
      product: product._id,
      quantity,
      color: String(row.color || '').trim(),
      price_at_purchase: resolveUnitPrice(product),
      addedAt: new Date(),
    })
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: normalized },
    { new: true, upsert: true, runValidators: true }
  ).populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** Legacy: PATCH /api/cart/items/:itemId */
export const updateCartItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity)
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new AppError('quantity must be at least 1', 400)
  }

  const cart = await getOrCreateCart(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw new AppError('Cart item not found', 404)

  const product = await Product.findById(item.product).select(
    'stock isPublished isActive basePrice price discountedPrice'
  )
  if (!product?.isPublished || product.isActive === false) {
    throw new AppError('Product no longer available', 400)
  }
  if (quantity > product.stock) {
    throw Errors.insufficientStock()
  }

  item.quantity = quantity
  item.price_at_purchase = resolveUnitPrice(product)
  await cart.save()
  await cart.populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  const lang = resolveLang(req)
  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})

/** Legacy: DELETE /api/cart/items/:itemId */
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw new AppError('Cart item not found', 404)

  cart.items.pull(req.params.itemId)
  await cart.save()
  await cart.populate({
    path: 'items.product',
    select:
      'name name_uz name_ru name_en basePrice price discountedPrice mainImage stock isPublished isActive slug sku',
  })

  const lang = resolveLang(req)
  res.json({ success: true, data: { cart: formatCart(cart, req, lang) } })
})
