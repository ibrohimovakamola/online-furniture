import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BreadCrumbs from '../components/BreadCrumbs'
import { storeApi } from '../api/storeApi'
import { formatSom } from '../features/kresla/utils/formatPrice'

const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  shipped: 'Yuborildi',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
}

const PAYMENT_LABELS = {
  pending: 'To\'lov kutilmoqda',
  awaiting: 'To\'lov kutilmoqda',
  paid: 'To\'langan',
  failed: 'Muvaffaqiyatsiz',
  refunded: 'Qaytarilgan',
}

export default function TrackOrder() {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await storeApi.trackOrder(token)
        if (!cancelled) setOrder(data.order)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Buyurtma topilmadi')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (token) load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="container py-12">
        <BreadCrumbs />
        <p className="text-center text-gray-600">Yuklanmoqda…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-12 max-w-lg mx-auto text-center">
        <BreadCrumbs />
        <p className="text-red-600 mb-4">{error || 'Buyurtma topilmadi'}</p>
        <Link to="/products" className="text-kresla-primary hover:underline">
          Xaridni davom ettirish
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <BreadCrumbs />
      <h1 className="text-2xl font-semibold text-kresla-dark mb-2">Buyurtma holati</h1>
      <p className="text-gray-600 mb-6">
        {order.orderNumber} · {order.guest?.name || order.shippingAddress?.fullName}
      </p>

      <div className="rounded-xl border border-gray-200 p-5 mb-6 space-y-2">
        <p>
          <span className="text-gray-500">Holat:</span>{' '}
          <strong>{STATUS_LABELS[order.status] || order.status}</strong>
        </p>
        <p>
          <span className="text-gray-500">To\'lov:</span>{' '}
          <strong>{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</strong>
        </p>
        <p>
          <span className="text-gray-500">Jami:</span> <strong>{formatSom(order.total)}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-medium mb-3">Mahsulotlar</h2>
        <ul className="space-y-2">
          {(order.items || []).map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatSom(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link to="/products" className="text-kresla-primary hover:underline">
        Xaridni davom ettirish
      </Link>
    </div>
  )
}
