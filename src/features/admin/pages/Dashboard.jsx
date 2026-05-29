import { useSelector } from 'react-redux'
import { ChevronDown, DollarSign, Package, ShoppingBag, Users } from 'lucide-react'
import StatCard from '../component/StatCard'
import LoadingSpinner from '../component/LoadingSpinner'
import AnalyticsChart from '../component/AnalyticsChart'
import RecentOrderActivity from '../component/RecentOrderActivity'
import { useAdminSearch } from '../context/AdminSearchContext'
import { getDateRangeLabel } from '../utils/dateFilter'
import { selectAdmin } from '../store/adminSlice'

const EMPTY_DASHBOARD = {
  products: 0,
  orders: 0,
  users: 0,
  revenue: 0,
  recentOrders: [],
  salesByCategory: [],
  trends: {
    products: [],
    orders: [],
    revenue: [],
    users: [],
  },
}

function Dashboard() {
  const { dateRange } = useAdminSearch()
  const { dashboardStats, loading, error } = useSelector(selectAdmin)
  const rangeLabel = getDateRangeLabel(dateRange)

  const stats = { ...EMPTY_DASHBOARD, ...(dashboardStats || {}) }
  const trends = stats.trends || EMPTY_DASHBOARD.trends
  const recentOrders = stats.recentOrders ?? []
  const salesByCategory = (stats.salesByCategory ?? []).filter((item) => item?.value > 0)

  if (loading.dashboard) {
    return <LoadingSpinner label="Loading dashboard…" fullScreen />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="admin-page-title">Dashboard</h1>
        <button type="button" className="admin-btn admin-btn--ghost self-start">
          All furniture store
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>
      </div>

      {error && !dashboardStats && (
        <div className="admin-card p-4 text-sm text-[var(--admin-danger)]">
          Could not load dashboard data. Showing empty state.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Products"
          value={String(stats.products ?? 0)}
          subtitle="Published catalog"
          icon={Package}
          sparkData={trends.products}
        />
        <StatCard
          title="Orders"
          value={String(stats.orders ?? 0)}
          subtitle={rangeLabel}
          icon={ShoppingBag}
          sparkData={trends.orders}
        />
        <StatCard
          title="Revenue"
          value={`$${Number(stats.revenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          sparkData={trends.revenue}
        />
        <StatCard
          title="Users"
          value={String(stats.users ?? 0)}
          subtitle="Registered customers"
          icon={Users}
          sparkData={trends.users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsChart
          data={salesByCategory.length ? salesByCategory : [{ name: 'No sales yet', value: 1 }]}
          title="Products by Category"
        />
        <RecentOrderActivity orders={recentOrders} />
      </div>
    </div>
  )
}

export default Dashboard
