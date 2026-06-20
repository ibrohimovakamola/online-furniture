import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import OrderTimeline from '../components/orders/OrderTimeline'
import { DEFAULT_ACCOUNT_MANAGER } from '../data/b2bContent'
import { formatSom } from '@/features/kresla/utils/formatPrice'

export default function B2BOrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    b2bApi.getOrder(orderId).then(({ data }) => setOrder(data.order)).catch(() => toast.error('Order not found'))
  }

  useEffect(() => {
    refresh()
    setLoading(false)
  }, [orderId])

  const downloadInvoice = async () => {
    try {
      const { data: gen } = await b2bApi.generateInvoice({ orderId: order.id })
      const invoiceId = gen.invoice?.id || gen.invoice?._id
      const { data } = await b2bApi.downloadInvoice(invoiceId)
      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/html' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${order.orderNumber}-invoice.html`
      a.click()
    } catch {
      toast.error('Invoice download failed')
    }
  }

  const reorder = async () => {
    try {
      const { data } = await b2bApi.reorder(orderId)
      toast.success('Reorder placed')
      navigate(`/designer-portal/orders/${data.order.id}`)
    } catch {
      toast.error('Reorder failed')
    }
  }

  if (loading || !order) {
    return <B2BVerifiedGate><p className="text-gray-500">Loading order…</p></B2BVerifiedGate>
  }

  const manager = DEFAULT_ACCOUNT_MANAGER

  return (
    <B2BVerifiedGate>
      <Link to="/designer-portal/orders" className="text-sm text-kresla-primary font-medium mb-4 inline-block">
        ← All orders
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white border p-6">
            <h2 className="text-xl font-semibold text-kresla-dark">{order.orderNumber}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Placed {new Date(order.createdAt).toLocaleString()}
              {order.estimatedDeliveryDate && (
                <> · Expected {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</>
              )}
            </p>
            {order.poNumber && <p className="text-sm mt-2">PO: {order.poNumber}</p>}
          </div>

          <div className="rounded-xl bg-white border p-6">
            <h3 className="font-semibold mb-4">Order Status</h3>
            <OrderTimeline order={order} />
          </div>

          <div className="rounded-xl bg-white border p-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <ul className="divide-y text-sm">
              {order.items?.map((item, idx) => (
                <li key={idx} className="py-3 flex justify-between">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatSom(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-right font-bold text-kresla-primary">{formatSom(order.total)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white border p-5 text-sm space-y-2">
            <h3 className="font-semibold">Delivery</h3>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>{order.shippingAddress?.city} {order.shippingAddress?.postalCode}</p>
            <p>{order.shippingAddress?.phone}</p>
            {order.status === 'shipped' && (
              <p className="text-kresla-primary font-medium pt-2">Tracking: EXC-{order.orderNumber}</p>
            )}
          </div>

          <div className="rounded-xl bg-white border p-5 space-y-2">
            <button type="button" onClick={downloadInvoice} className="w-full rounded-lg border py-2 text-sm font-medium hover:bg-gray-50">
              Download Invoice
            </button>
            <button type="button" onClick={reorder} className="w-full rounded-lg bg-kresla-dark text-white py-2 text-sm font-semibold">
              Reorder Same Items
            </button>
            <a href={`mailto:${manager.email}?subject=Order ${order.orderNumber}`} className="block w-full text-center rounded-lg border py-2 text-sm font-medium">
              Contact Account Manager
            </a>
          </div>

          <p className="text-xs text-gray-500">
            Email updates are sent when your order ships. SMS notifications can be enabled in Account → Preferences.
          </p>
        </div>
      </div>
    </B2BVerifiedGate>
  )
}
