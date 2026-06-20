import { Fragment, useState } from 'react'
import StatusBadge from './StatusBadge'
import InstallmentProgress from '../../../components/checkout/InstallmentProgress'

const PAYMENT_LABELS = {
  card: 'Card',
  cash: 'Cash',
  installment: 'Installment',
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

function OrderTable({ orders, onStatusChange, onInstallmentPayment, updatingId, payingId }) {
  const safeOrders = Array.isArray(orders) ? orders : []
  const [expandedId, setExpandedId] = useState(null)

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
            {onInstallmentPayment && (
              <th className="text-left py-4 px-4 font-medium text-[var(--admin-text-muted)] hidden lg:table-cell">Installment</th>
            )}
          </tr>
        </thead>
        <tbody>
          {safeOrders.map((order) => {
            const isInstallment = order.paymentMethod === 'installment' && order.installmentDetails
            const details = order.installmentDetails
            const canRecordPayment =
              isInstallment && details && details.paidMonths < details.planMonths

            return (
              <Fragment key={order.id || order.orderNumber}>
                <tr
                  key={order.id || order.orderNumber}
                  className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-[var(--admin-text)]">
                    <button
                      type="button"
                      className="text-left hover:text-[var(--admin-accent)]"
                      onClick={() =>
                        isInstallment &&
                        setExpandedId(expandedId === order.id ? null : order.id)
                      }
                    >
                      {order.orderNumber}
                      {isInstallment && (
                        <span className="ml-2 text-xs text-[var(--admin-accent)]">↕</span>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-[var(--admin-text)]">{order.customerName || '—'}</p>
                    <p className="text-xs text-[var(--admin-text-subtle)]">{order.customerEmail || ''}</p>
                  </td>
                  <td className="py-4 px-4 text-[var(--admin-text-muted)] hidden md:table-cell">
                    {formatDate(order.date || order.createdAt)}
                  </td>
                  <td className="py-4 px-4 font-semibold text-[var(--admin-text)]">
                    ${Number(order.total || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <span className="text-[var(--admin-text-muted)]">
                      {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
                    </span>
                    <span
                      className={`admin-badge ml-2 ${
                        order.paymentStatus === 'paid'
                          ? 'admin-badge--success'
                          : 'admin-badge--pending'
                      }`}
                    >
                      {order.paymentStatus || 'pending'}
                    </span>
                    {isInstallment && (
                      <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">
                        {details.paidMonths}/{details.planMonths} mo.
                      </p>
                    )}
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
                  {onInstallmentPayment && (
                    <td className="py-4 px-4 hidden lg:table-cell">
                      {canRecordPayment ? (
                        <button
                          type="button"
                          disabled={payingId === order.id}
                          onClick={() => onInstallmentPayment(order.id)}
                          className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
                        >
                          {payingId === order.id ? 'Saving…' : 'Mark month paid'}
                        </button>
                      ) : isInstallment ? (
                        <span className="text-xs text-[var(--admin-text-muted)]">Complete</span>
                      ) : (
                        <span className="text-xs text-[var(--admin-text-subtle)]">—</span>
                      )}
                    </td>
                  )}
                </tr>
                {isInstallment && expandedId === order.id && (
                  <tr key={`${order.id}-detail`} className="border-b border-[var(--admin-border)]">
                    <td colSpan={onInstallmentPayment ? 7 : 6} className="px-4 pb-4">
                      <InstallmentProgress installmentDetails={details} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrderTable
