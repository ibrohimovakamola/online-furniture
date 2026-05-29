import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import LoadingSpinner from '../component/LoadingSpinner'
import StatCard from '../component/StatCard'
import AnalyticsChart from '../component/AnalyticsChart'
import { useAdminSearch } from '../context/AdminSearchContext'
import { selectAdmin, fetchAnalytics } from '../store/adminSlice'

function AnalyticsAdmin() {
  const dispatch = useDispatch()
  const { dateRange } = useAdminSearch()
  const { analytics, loading } = useSelector(selectAdmin)

  useEffect(() => {
    dispatch(fetchAnalytics(dateRange))
  }, [dispatch, dateRange])

  if (loading.analytics) {
    return <LoadingSpinner label="Loading analytics…" fullScreen />
  }

  const categoryData = (analytics?.topProducts || []).map((p) => ({
    name: p.name,
    value: p.quantity,
  }))

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Analytics" subtitle="Sales overview and performance metrics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Revenue" value={`$${(analytics?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Total Orders" value={String(analytics?.orderCount || 0)} icon={ShoppingBag} />
        <StatCard title="Items Sold" value={String(analytics?.itemsSold || 0)} icon={Package} />
        <StatCard title="Customers" value={String(analytics?.customerCount || 0)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsChart data={categoryData.length ? categoryData : [{ name: 'No sales yet', value: 1 }]} title="Top Selling Products" />

        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            {(analytics?.statusBreakdown || []).map((s) => (
              <div key={s._id} className="flex justify-between items-center py-2 border-b border-[var(--admin-border)]">
                <span className="capitalize text-[var(--admin-text-muted)]">{s._id}</span>
                <span className="admin-badge admin-badge--success">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsAdmin
