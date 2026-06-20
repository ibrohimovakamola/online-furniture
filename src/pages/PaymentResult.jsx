import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../features/auth/authSlice'
import { paymentApi } from '../services/paymentApi'
import { storeApi } from '../api/storeApi'
import BreadCrumbs from '../components/BreadCrumbs'
import { formatSom } from '../features/kresla/utils/formatPrice'

const STATUS_CONFIG = {
  paid: {
    icon: 'fa-circle-check',
    color: 'text-green-600',
    title: "To'lov muvaffaqiyatli!",
    message: 'Buyurtmangiz tasdiqlandi. Tez orada yetkazib beramiz.',
  },
  pending: {
    icon: 'fa-clock',
    color: 'text-amber-600',
    title: "To'lov kutilmoqda",
    message: "To'lov hali tasdiqlanmagan. Bir necha daqiqadan so'ng qayta tekshiring.",
  },
  failed: {
    icon: 'fa-circle-xmark',
    color: 'text-red-600',
    title: "To'lov amalga oshmadi",
    message: "To'lov bekor qilindi yoki xatolik yuz berdi. Qayta urinib ko'ring.",
  },
}

function PaymentResult() {
  const [searchParams] = useSearchParams()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const orderId = searchParams.get('orderId') || searchParams.get('order_id')
  const gateway = searchParams.get('gateway') || ''
  const isGuestReturn = searchParams.get('guest') === '1'
  const guestTrackToken = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('guestOrderTrackToken')
    : null

  const [loading, setLoading] = useState(Boolean(orderId && (isAuthenticated || (isGuestReturn && guestTrackToken))))
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    if (!isAuthenticated && !(isGuestReturn && guestTrackToken)) return

    let cancelled = false
    const poll = async (attempt = 0) => {
      try {
        const { data } = isAuthenticated
          ? await paymentApi.status(orderId)
          : await storeApi.trackOrder(guestTrackToken)
        if (cancelled) return
        setOrder(data.order)
        setPayment(data.payment || null)

        const paymentStatus = data.order?.paymentStatus
        const stillPending = paymentStatus === 'pending' || paymentStatus === 'awaiting'
        if (stillPending && attempt < 5) {
          setTimeout(() => poll(attempt + 1), 3000)
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Status tekshirilmadi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [orderId, isAuthenticated, isGuestReturn, guestTrackToken])

  const statusKey = order?.paymentStatus === 'paid' ? 'paid' : order?.paymentStatus === 'failed' ? 'failed' : 'pending'
  const cfg = STATUS_CONFIG[statusKey]

  return (
    <div className="container py-12 max-w-lg mx-auto">
      <BreadCrumbs />
      <div className="empty-card extra text-center">
        {loading ? (
          <p className="text-gray-600">To&apos;lov holati tekshirilmoqda…</p>
        ) : error ? (
          <>
            <i className={`fa-solid fa-triangle-exclamation text-4xl text-amber-600 mb-4`} />
            <p className="empty-text">{error}</p>
          </>
        ) : (
          <>
            <i className={`fa-solid ${cfg.icon} text-4xl ${cfg.color} mb-4`} />
            <h2 className="text-xl font-semibold mb-2">{cfg.title}</h2>
            <p className="text-gray-600 mb-4">{cfg.message}</p>
            {gateway && (
              <p className="text-sm text-gray-500 mb-2">To&apos;lov usuli: {gateway.toUpperCase()}</p>
            )}
            {order && (
              <div className="text-sm text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-1">
                <p>
                  Buyurtma: <strong>{order.orderNumber}</strong>
                </p>
                <p>
                  Jami: <strong>{formatSom(order.total)}</strong>
                </p>
                {payment?.transactionId && (
                  <p>
                    Tranzaksiya: <strong>{payment.transactionId}</strong>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {statusKey === 'pending' && orderId && isAuthenticated && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="empty-btn"
            >
              Qayta tekshirish
            </button>
          )}
          {statusKey === 'failed' && (
            <Link to="/cart" className="empty-btn">
              Savatga qaytish
            </Link>
          )}
          {isAuthenticated && orderId && (
            <Link to={`/orders/${orderId}`} className="empty-btn border border-kresla-primary text-kresla-primary">
              Buyurtma tafsilotlari
            </Link>
          )}
          {!isAuthenticated && guestTrackToken && (
            <Link
              to={`/track/${encodeURIComponent(guestTrackToken)}`}
              className="empty-btn border border-kresla-primary text-kresla-primary"
            >
              Buyurtmani kuzatish
            </Link>
          )}
          <Link to="/products" className="text-sm text-gray-500 hover:underline self-center">
            Mahsulotlarga
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
