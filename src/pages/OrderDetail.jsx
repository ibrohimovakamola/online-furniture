import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import BreadCrumbs from '../components/BreadCrumbs'
import InstallmentProgress from '../components/checkout/InstallmentProgress'
import { formatSom } from '../features/kresla/utils/formatPrice'
import {
  clearCurrentOrder,
  fetchMyOrder,
  selectOrders,
} from '../features/orders/orderSlice'

const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  shipped: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function OrderDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentOrder: order, loading } = useSelector(selectOrders)

  useEffect(() => {
    dispatch(fetchMyOrder(id))
    return () => dispatch(clearCurrentOrder())
  }, [dispatch, id])

  if (loading.order) {
    return (
      <div className="container py-10">
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-10 text-center">
        <p className="text-gray-600">Buyurtma topilmadi</p>
        <Link to="/orders" className="mt-4 inline-block text-kresla-primary hover:underline">
          Buyurtmalarga qaytish
        </Link>
      </div>
    )
  }

  const isInstallment = order.paymentMethod === 'installment' && order.installmentDetails

  return (
    <div className="container py-10">
      <BreadCrumbs />
      <Link to="/orders" className="mb-4 inline-block text-sm text-kresla-primary hover:underline">
        ← Buyurtmalarga qaytish
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-kresla-dark">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium">
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {isInstallment && (
        <div className="mb-8">
          <InstallmentProgress installmentDetails={order.installmentDetails} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 p-5">
          <h2 className="mb-4 font-semibold text-kresla-dark">Mahsulotlar</h2>
          <ul className="space-y-3">
            {(order.items || []).map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">{formatSom(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 p-5">
          <h2 className="mb-4 font-semibold text-kresla-dark">Yetkazib berish</h2>
          <address className="not-italic text-sm text-gray-600">
            <p className="font-medium text-kresla-dark">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.phone}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}
              {order.shippingAddress?.region ? `, ${order.shippingAddress.region}` : ''}
            </p>
          </address>

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Oraliq summa</span>
              <span>{formatSom(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Yetkazish</span>
              <span>{formatSom(order.shippingCost)}</span>
            </div>
            {order.serviceFees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Premium xizmatlar</span>
                <span>{formatSom(order.serviceFees)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold">
              <span>Jami</span>
              <span className="text-kresla-primary">{formatSom(order.total)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
