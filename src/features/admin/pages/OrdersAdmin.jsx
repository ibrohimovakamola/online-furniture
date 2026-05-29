import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminPageHeader from '../component/AdminPageHeader'
import OrderTable from '../component/OrderTable'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch } from '../context/AdminSearchContext'
import { matchesSearch } from '../utils/dateFilter'
import { selectAdmin, updateOrderStatus } from '../store/adminSlice'

function OrdersAdmin() {
  const dispatch = useDispatch()
  const { searchQuery } = useAdminSearch()
  const { orders, loading } = useSelector(selectAdmin)
  const [updatingId, setUpdatingId] = useState(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      matchesSearch(o, searchQuery, ['orderNumber', 'customerName', 'customerEmail'])
    )
  }, [orders, searchQuery])

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

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Buyurtmalar — track and update customer order pipeline"
      />

      <div className="admin-card p-2 sm:p-4">
        {loading.orders ? (
          <LoadingSpinner label="Loading orders…" />
        ) : !filteredOrders?.length ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">
            {orders?.length
              ? 'No orders match your search or date filter.'
              : 'No orders yet. Orders appear here after customers complete checkout.'}
          </p>
        ) : (
          <OrderTable
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        )}
      </div>
    </div>
  )
}

export default OrdersAdmin
