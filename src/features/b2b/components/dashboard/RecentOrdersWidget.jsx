import { Link } from 'react-router-dom'
import { formatSom } from '@/features/kresla/utils/formatPrice'

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function RecentOrdersWidget({ orders = [], onDownloadInvoice }) {
  return (
    <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-kresla-dark">Recent Orders</h3>
        <Link to="/designer-portal/orders" className="text-sm font-semibold text-kresla-primary">
          View all →
        </Link>
      </div>
      {!orders.length ? (
        <p className="text-sm text-gray-500">No orders yet. Browse the catalog to place your first order.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Order ID</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{o.orderNumber}</td>
                  <td className="py-3 text-gray-600">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_CLASS[o.status] || STATUS_CLASS.pending}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">{formatSom(o.total)}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Link to={`/designer-portal/orders/${o.id}`} className="text-kresla-primary font-medium text-xs">
                        Details
                      </Link>
                      <button
                        type="button"
                        className="text-gray-600 font-medium text-xs hover:text-kresla-primary"
                        onClick={() => onDownloadInvoice?.(o.id)}
                      >
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
