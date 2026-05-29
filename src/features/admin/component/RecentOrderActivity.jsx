function RecentOrderActivity({ orders = [] }) {
  const safeOrders = Array.isArray(orders) ? orders : []

  if (safeOrders.length === 0) {
    return (
      <div className="admin-card p-6">
        <h3 className="text-sm font-semibold text-[var(--admin-text)] mb-2">Recent Activity</h3>
        <p className="py-12 text-center text-sm text-[var(--admin-text-muted)]">
          No recent activity found.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-card p-6">
      <h3 className="text-sm font-semibold text-[var(--admin-text)] mb-4">Recent Activity</h3>
      <ul className="space-y-3">
        {safeOrders.map((order) => (
          <li
            key={order.id || order.orderNumber}
            className="flex items-center justify-between gap-4 py-3 border-b border-[var(--admin-border)] last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--admin-text)] truncate">
                {order.orderNumber}
              </p>
              <p className="text-xs text-[var(--admin-text-muted)] truncate">
                {order.customerName || 'Customer'} · {order.status || 'pending'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-[var(--admin-text)]">
                ${Number(order.total || 0).toLocaleString()}
              </p>
              <p className="text-xs text-[var(--admin-text-subtle)] capitalize">
                {order.paymentStatus || 'pending'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecentOrderActivity
