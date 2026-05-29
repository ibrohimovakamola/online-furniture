import StatusBadge from './StatusBadge'

const PAYMENT_LABELS = {
  card: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function OrderTable({ orders, onStatusChange, updatingId }) {
  const safeOrders = Array.isArray(orders) ? orders : []

  if (safeOrders.length === 0) {
    return (
      <div className="py-16 text-center text-[var(--admin-text-muted)]">
        No orders yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--admin-border)]">
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)]">Order ID</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)]">Customer</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden md:table-cell">Date</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)]">Total</th>
            <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden sm:table-cell">Payment</th>
            {onStatusChange && (
              <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)]">Status</th>
            )}
          </tr>
        </thead>
        <tbody>
          {safeOrders.map((order) => (
            <tr key={order.id || order.orderNumber} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
              <td className="py-4 px-4 font-medium text-[var(--admin-text)]">{order.orderNumber}</td>
              <td className="py-4 px-4">
                <p className="text-[var(--admin-text)]">{order.customerName || '—'}</p>
                <p className="text-xs text-[var(--admin-text-subtle)]">{order.customerEmail || ''}</p>
              </td>
              <td className="py-4 px-4 text-[var(--admin-text-muted)] hidden md:table-cell">{formatDate(order.date || order.createdAt)}</td>
              <td className="py-4 px-4 font-semibold text-[var(--admin-text)]">${Number(order.total || 0).toLocaleString()}</td>
              <td className="py-4 px-4 hidden sm:table-cell">
                <span className="text-[var(--admin-text-muted)]">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</span>
                <span className={`admin-badge ml-2 ${order.paymentStatus === 'paid' ? 'admin-badge--success' : 'admin-badge--pending'}`}>
                  {order.paymentStatus || 'pending'}
                </span>
              </td>
              {onStatusChange && (
                <td className="py-4 px-4">
                  <StatusBadge
                    status={order.status}
                    onChange={(status) => onStatusChange(order.id, status)}
                    disabled={updatingId === order.id}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrderTable
