import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import { formatSom } from '@/features/kresla/utils/formatPrice'

export default function B2BOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    b2bApi
      .getOrders()
      .then(({ data }) => setOrders(data.orders || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <B2BVerifiedGate>
      <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Order Management</h2>
      {loading ? (
        <p className="text-gray-500">Loading orders…</p>
      ) : !orders.length ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="rounded-xl bg-white border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-kresla-dark text-white">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-medium">{o.orderNumber}</td>
                  <td className="p-3 text-center">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-center capitalize">{o.status}</td>
                  <td className="p-3 text-right">{formatSom(o.total)}</td>
                  <td className="p-3 text-right">
                    <Link to={`/designer-portal/orders/${o.id}`} className="text-kresla-primary font-semibold">
                      Track →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </B2BVerifiedGate>
  )
}
