import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminPageHeader from '../component/AdminPageHeader'
import OrderTable from '../component/OrderTable'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch } from '../context/AdminSearchContext'
import { matchesSearch } from '../utils/dateFilter'
import {
  selectAdmin,
  updateOrderStatus,
  recordInstallmentPayment,
} from '../store/adminSlice'

function OrdersAdmin() {
  const dispatch = useDispatch()
  const { searchQuery } = useAdminSearch()
  const { orders, loading } = useSelector(selectAdmin)
  const [updatingId, setUpdatingId] = useState(null)
  const [payingId, setPayingId] = useState(null)
  const [paymentFilter, setPaymentFilter] = useState('all')

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesText = matchesSearch(o, searchQuery, [
        'orderNumber',
        'customerName',
        'customerEmail',
      ])
      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'installment' && o.paymentMethod === 'installment')
      return matchesText && matchesPayment
    })
  }, [orders, searchQuery, paymentFilter])

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id)
    const result = await dispatch(updateOrderStatus({ id, status }))
    setUpdatingId(null)

    if (updateOrderStatus.fulfilled.match(result)) {
      toast.success('Order status updated')
    } else {
      toast.error(result.payload || 'Failed to update status')
    }
  }

  const handleInstallmentPayment = async (id) => {
    setPayingId(id)
    const result = await dispatch(recordInstallmentPayment({ id }))
    setPayingId(null)

    if (recordInstallmentPayment.fulfilled.match(result)) {
      toast.success('Installment payment recorded')
    } else {
      toast.error(result.payload || 'Failed to record payment')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Buyurtmalar — track and update customer order pipeline"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All orders' },
          { id: 'installment', label: 'Installment only' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPaymentFilter(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              paymentFilter === id
                ? 'bg-[var(--admin-accent)] text-white'
                : 'border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-hover)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-card p-2 sm:p-4">
        {loading.orders ? (
          <LoadingSpinner label="Loading orders…" />
        ) : !filteredOrders?.length ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">
            {orders?.length
              ? 'No orders match your search or filter.'
              : 'No orders yet. Orders appear here after customers complete checkout.'}
          </p>
        ) : (
          <OrderTable
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onInstallmentPayment={handleInstallmentPayment}
            updatingId={updatingId}
            payingId={payingId}
          />
        )}
      </div>
    </div>
  )
}

export default OrdersAdmin
