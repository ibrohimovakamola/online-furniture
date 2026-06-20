import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import BreadCrumbs from '../components/BreadCrumbs'
import { formatSom } from '../features/kresla/utils/formatPrice'
import { fetchMyOrders, selectOrders } from '../features/orders/orderSlice'

const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  shipped: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
}

const PAYMENT_LABELS = {
  card: 'Karta',
  cash: 'Naqd',
  installment: 'Bo\'lib to\'lash',
  online: 'Onlayn',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function MyOrders() {
  const dispatch = useDispatch()
  const { myOrders, loading } = useSelector(selectOrders)

  useEffect(() => {
    dispatch(fetchMyOrders())
  }, [dispatch])

  return (
    <div className="container py-10">
      <BreadCrumbs />
      <h1 className="mb-2 text-2xl font-semibold text-kresla-dark">Buyurtmalarim</h1>
      <p className="mb-8 text-gray-600">Barcha buyurtmalaringiz va to&apos;lov holati</p>

      {loading.orders ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : myOrders.length === 0 ? (
        <div className="empty-card extra">
          <i className="fa-solid fa-box-open" />
          <p className="empty-text">Hali buyurtmalar yo&apos;q</p>
          <Link to="/products" className="empty-btn">
            Xarid qilishni boshlash
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-kresla-dark">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-kresla-primary">{formatSom(order.total)}</p>
                  <p className="text-xs text-gray-500">
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                {order.paymentMethod === 'installment' && order.installmentDetails && (
                  <span className="rounded-full bg-kresla-primary/10 px-3 py-1 text-xs font-medium text-kresla-primary">
                    {order.installmentDetails.paidMonths}/{order.installmentDetails.planMonths} oy
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
