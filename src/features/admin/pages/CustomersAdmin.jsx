import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Shield, ShieldOff, User } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch, useDebouncedValue } from '../context/AdminSearchContext'
import { filterByDateRange, matchesSearch } from '../utils/dateFilter'
import {
  selectAdmin,
  fetchCustomers,
  toggleCustomerBlock,
  updateCustomerRole,
} from '../store/adminSlice'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function CustomersAdmin() {
  const dispatch = useDispatch()
  const { searchQuery, dateRange } = useAdminSearch()
  const debouncedSearch = useDebouncedValue(searchQuery)
  const { customers, loading } = useSelector(selectAdmin)
  const [blockingId, setBlockingId] = useState(null)
  const [roleUpdatingId, setRoleUpdatingId] = useState(null)

  const filteredCustomers = useMemo(() => {
    let list = filterByDateRange(customers, dateRange)
    return list.filter((c) =>
      matchesSearch(c, searchQuery, ['name', 'email', 'firstName', 'lastName'])
    )
  }, [customers, dateRange, searchQuery])

  useEffect(() => {
    dispatch(fetchCustomers(debouncedSearch))
  }, [dispatch, debouncedSearch])

  const handleToggleBlock = async (customer) => {
    setBlockingId(customer.id)
    const result = await dispatch(toggleCustomerBlock(customer.id))
    setBlockingId(null)
    if (toggleCustomerBlock.fulfilled.match(result)) {
      toast.success(result.payload.isActive ? 'User unblocked' : 'User blocked')
    } else {
      toast.error(result.payload || 'Action failed')
    }
  }

  const handleRoleChange = async (customer, role) => {
    setRoleUpdatingId(customer.id)
    const result = await dispatch(updateCustomerRole({ id: customer.id, role }))
    setRoleUpdatingId(null)
    if (updateCustomerRole.fulfilled.match(result)) {
      toast.success('Role updated')
    } else {
      toast.error(result.payload || 'Failed to update role')
    }
  }

  return (
    <div>
      <AdminPageHeader title="Customers" subtitle="Live registry from MongoDB users" />

      <div className="admin-card p-2 sm:p-4">
        {loading.customers ? (
          <LoadingSpinner label="Loading customers…" />
        ) : filteredCustomers.length === 0 ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">
            {customers.length
              ? 'No customers match your search or date filter.'
              : 'No customers found. Restart the backend with SEED_ADMIN_DATA=true to seed demo users.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">User</th>
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">Email</th>
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">Manzil</th>
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">Role</th>
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">Registered</th>
                  <th className="text-left py-4 px-4 text-[var(--admin-text-muted)]">Orders</th>
                  <th className="text-right py-4 px-4 text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)] transition-colors ${
                      c.isBlocked ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5eead4]/15 text-[#5eead4] font-semibold text-sm">
                          {c.initials || <User className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-[var(--admin-text)]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[var(--admin-text-muted)]">{c.email}</td>
                    <td className="py-4 px-4 text-[var(--admin-text-muted)] max-w-[180px] truncate">
                      {c.address || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        className="admin-input py-1.5 text-sm capitalize min-w-[120px]"
                        value={c.role}
                        disabled={roleUpdatingId === c.id}
                        onChange={(e) => handleRoleChange(c, e.target.value)}
                      >
                        <option value="customer">Customer</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-[var(--admin-text-muted)] whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-[var(--admin-text)]">{c.totalOrders}</span>
                      {c.totalSpent > 0 && (
                        <span className="block text-xs text-[var(--admin-text-muted)]">
                          ${c.totalSpent?.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        className={`admin-btn admin-btn--icon ${c.isBlocked ? 'admin-btn--primary' : 'admin-btn--danger'}`}
                        onClick={() => handleToggleBlock(c)}
                        disabled={blockingId === c.id}
                        title={c.isBlocked ? 'Unblock user' : 'Block user'}
                      >
                        {c.isBlocked ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <ShieldOff className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomersAdmin
