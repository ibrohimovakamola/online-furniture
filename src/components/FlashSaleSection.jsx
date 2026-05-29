import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import ProductCard from './ProductCard'
import { storeApi } from '../api/storeApi'
import '../assets/styles/products.scss'

function formatCountdown(endsAt) {
  if (!endsAt) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const totalMs = Math.max(0, new Date(endsAt).getTime() - Date.now())
  return {
    days: Math.floor(totalMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalMs / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((totalMs / (1000 * 60)) % 60),
    seconds: Math.floor((totalMs / 1000) % 60),
  }
}

const pad = (num) => (num < 10 ? `0${num}` : String(num))

export default function FlashSaleSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    let cancelled = false
    storeApi
      .flashSale()
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch(() => {
        if (!cancelled) setData({ config: { enabled: false }, products: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const config = data?.config
  const products = data?.products ?? []
  const visible =
    config?.enabled &&
    config?.isActive &&
    config?.showOnHomepage !== false &&
    products.length > 0

  useEffect(() => {
    if (!config?.endsAt || !visible) return undefined
    const tick = () => setCountdown(formatCountdown(config.endsAt))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [config?.endsAt, visible])

  if (!loading && !visible) return null

  return (
    <div className="container">
      <div className="carousel-header">
        <div className="product-head">
          <h4 className="product-subtitle">
            <p />
            Today&apos;s
          </h4>
          <div className="product-row">
            <div className="product-left">
              <h2 className="product-title">{config?.title || 'Flash Sales'}</h2>
              <div className="product-times">
                <div className="product-time--box">
                  <p>Days</p>
                  <h2>{pad(countdown.days)}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Hours</p>
                  <h2>{pad(countdown.hours)}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Minutes</p>
                  <h2>{pad(countdown.minutes)}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Seconds</p>
                  <h2>{pad(countdown.seconds)}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="product-cards">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="skeleton-card">
                <Skeleton className="skeleton-img" />
                <Skeleton className="skeleton-line" />
              </div>
            ))}
        </div>
      ) : (
        <div className="product-cards">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}

      <div className="product-view--all">
        <Link to="/products" className="product-all--btn">
          View All Products
        </Link>
      </div>
      <div className="product-line" />
    </div>
  )
}
