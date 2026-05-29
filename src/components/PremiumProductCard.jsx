import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, Eye, Star } from 'lucide-react'
import { addToCart } from '../features/cart/cartSlice'
import { addToFavourite } from '../features/favourite/favourite'
import { getProductImageSource } from '../utils/productImage'
import Modal from './Modal'

function getDisplayRating(product) {
  const seed = String(product?.id || product?.name || '')
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const rating = 4 + (seed % 10) / 10
  const count = 48 + (seed % 180)
  return { rating: Math.min(5, rating), count }
}

function PremiumProductCard({ product }) {
  const dispatch = useDispatch()
  const [modal, setModal] = useState({ open: false, text: '', icon: '' })

  const isFavorite = useSelector((state) =>
    state.favourite.items.some((fav) => fav.id === product.id)
  )

  const imageSrc = getProductImageSource(product)
  const hasDiscount = product.discountedPrice && product.basePrice > product.discountedPrice
  const displayPrice = product.price ?? product.discountedPrice ?? product.basePrice
  const { rating, count } = getDisplayRating(product)

  const showToast = (text, icon) => {
    setModal({ open: true, text, icon })
    setTimeout(() => setModal({ open: false, text: '', icon: '' }), 2000)
  }

  const handleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(addToFavourite({ ...product, quantity: 1 }))
    showToast('Added to wishlist', 'fa-solid fa-heart')
  }

  const handleQuickView = (e) => {
    e.stopPropagation()
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(addToCart({ ...product, quantity: 1 }))
    showToast('Added to cart', 'fa-regular fa-circle-check')
  }

  return (
    <article className="group flex flex-col">
      <Link
        to={`/products/${product.id}`}
        className="relative block overflow-hidden rounded-lg bg-[#f5f5f5] aspect-[4/5] sm:aspect-[270/250]"
      >
        {product.discountPercentage > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded bg-[#DB4444] px-3 py-1 text-xs font-medium text-white">
            -{product.discountPercentage}%
          </span>
        )}

        <img
          src={imageSrc || '/vite.svg'}
          alt={product.title || product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleFavorite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b3c3c] shadow-md transition hover:bg-[#0b3c3c] hover:text-white"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'fill-[#DB4444] text-[#DB4444]' : ''}`}
              strokeWidth={2}
            />
          </button>
          <Link
            to={`/products/${product.id}`}
            onClick={handleQuickView}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b3c3c] shadow-md transition hover:bg-[#0b3c3c] hover:text-white"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 z-10 translate-y-full bg-[#0b3c3c] py-2.5 text-sm font-medium text-white transition-transform duration-300 group-hover:translate-y-0"
        >
          Add to Cart
        </button>
      </Link>

      <div className="mt-4 flex flex-col gap-2">
        <h3 className="font-[Poppins] text-base font-medium leading-snug text-[#1a1a1a] line-clamp-2">
          {product.title || product.name}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-[Poppins] text-base font-semibold text-[#DB4444]">
            ${Number(displayPrice).toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="font-[Poppins] text-sm text-[#999] line-through">
              ${Number(product.basePrice).toFixed(0)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-[#FFAD33]" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'fill-[#FFAD33]' : 'fill-transparent'}`}
                strokeWidth={1.5}
              />
            ))}
          </div>
          <span className="text-xs text-[#888]">({count})</span>
        </div>
      </div>

      {modal.open && <Modal text={modal.text} icon={modal.icon} />}
    </article>
  )
}

export default PremiumProductCard
