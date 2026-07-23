import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  Sun,
  Moon,
  Plus,
  FileText,
} from 'lucide-react'
import DateRangeFilter from './DateRangeFilter'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { selectUser } from '@/features/auth'
import { useAdminSearch } from '../context/AdminSearchContext'
import { selectAdmin } from '../store/adminSlice'
import { filterByDateRange, matchesSearch } from '../utils/dateFilter'
import { downloadCsv } from '../utils/exportReport'

export const DATE_RANGE_OPTIONS = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: '12months', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
]

function AdminTopbar({ theme, onToggleTheme, onMenuClick }) {
  const user = useSelector(selectUser)
  const location = useLocation()
  const admin = useSelector(selectAdmin)
  const {
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    pendingOrdersCount,
  } = useAdminSearch()

  const searchEnabled = ['/admin/products', '/admin/categories', '/admin/orders', '/admin/customers'].some(
    (path) => location.pathname.startsWith(path)
  )

  const placeholder = location.pathname.includes('customers')
    ? 'Search customers...'
    : location.pathname.includes('orders')
      ? 'Search orders or customers...'
      : location.pathname.includes('categories')
        ? 'Search categories...'
        : 'Search products by name or SKU...'

  const reportRows = useMemo(() => {
    const path = location.pathname

    if (path.startsWith('/admin/products')) {
      let rows = filterByDateRange(admin.products, dateRange)
      rows = rows.filter((p) => matchesSearch(p, searchQuery, ['name', 'sku', 'title']))
      return {
        filename: `products-report-${dateRange}.csv`,
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'sku', label: 'SKU' },
          { key: 'basePrice', label: 'Price' },
          { key: 'stock', label: 'Stock' },
          { key: 'createdAt', label: 'Created' },
        ],
        rows: rows.map((p) => ({
          name: p.name || p.title,
          sku: p.sku || '',
          basePrice: p.basePrice ?? p.price,
          stock: p.stock,
          createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString() : '',
        })),
      }
    }

    if (path.startsWith('/admin/orders')) {
      let rows = filterByDateRange(admin.orders, dateRange, 'date')
      rows = rows.filter((o) =>
        matchesSearch(o, searchQuery, ['orderNumber', 'customerName', 'customerEmail'])
      )
      return {
        filename: `orders-report-${dateRange}.csv`,
        columns: [
          { key: 'orderNumber', label: 'Order' },
          { key: 'customerName', label: 'Customer' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Date' },
        ],
        rows: rows.map((o) => ({
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          total: o.total,
          status: o.status,
          date: o.date ? new Date(o.date).toLocaleString() : '',
        })),
      }
    }

    if (path.startsWith('/admin/categories')) {
      let rows = filterByDateRange(admin.categories, dateRange)
      rows = rows.filter((c) => matchesSearch(c, searchQuery, ['name', 'slug']))
      return {
        filename: `categories-report-${dateRange}.csv`,
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'productCount', label: 'Products' },
          { key: 'createdAt', label: 'Created' },
        ],
        rows: rows.map((c) => ({
          name: c.name,
          slug: c.slug,
          productCount: c.productCount,
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
        })),
      }
    }

    if (path.startsWith('/admin/customers')) {
      let rows = filterByDateRange(admin.customers, dateRange)
      rows = rows.filter((c) => matchesSearch(c, searchQuery, ['name', 'email', 'firstName', 'lastName']))
      return {
        filename: `customers-report-${dateRange}.csv`,
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'totalOrders', label: 'Orders' },
        ],
        rows: rows.map((c) => ({
          name: c.name,
          email: c.email,
          role: c.role,
          totalOrders: c.totalOrders,
        })),
      }
    }

    return null
  }, [location.pathname, admin, dateRange, searchQuery])

  const handleGenerateReport = () => {
    if (!reportRows?.rows?.length) {
      toast.error('No rows to export for this view')
      return
    }
    const result = downloadCsv(reportRows.filename, reportRows.rows, reportRows.columns)
    if (result.ok) toast.success('Report downloaded')
    else toast.error(result.message)
  }

  const showNotificationDot = pendingOrdersCount > 0

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 border-b border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/90 backdrop-blur-md"
      style={{ minHeight: 'var(--admin-topbar-height)' }}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="admin-btn admin-btn--ghost admin-btn--icon lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-subtle)]" />
        <input
          type="search"
          placeholder={searchEnabled ? placeholder : 'Quick search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!searchEnabled}
          className="admin-input disabled:opacity-50"
          aria-label="Search admin data"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <DateRangeFilter
          className="hidden md:block"
          value={dateRange}
          onChange={setDateRange}
          options={DATE_RANGE_OPTIONS}
        />

        <Link to="/admin/products" className="admin-btn admin-btn--primary hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Add Product
        </Link>

        <button
          type="button"
          className="admin-btn admin-btn--outline hidden md:inline-flex"
          onClick={handleGenerateReport}
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>

        <LanguageSwitcher className="admin-lang-select hidden sm:block text-sm rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1.5" />

        <button
          type="button"
          onClick={onToggleTheme}
          className="admin-btn admin-btn--ghost admin-btn--icon"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          className="admin-btn admin-btn--ghost admin-btn--icon"
          title="Help — contact support via Settings"
          onClick={() => toast('Open Settings for store contact details', { icon: 'ℹ️' })}
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <Link
          to="/admin/orders"
          className="admin-btn admin-btn--ghost admin-btn--icon relative"
          aria-label={`Notifications${showNotificationDot ? `, ${pendingOrdersCount} pending` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {showNotificationDot && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f87171] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[var(--admin-bg-elevated)]"
            >
              {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-2 ml-1 border-l border-[var(--admin-border)]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-[var(--admin-text)] leading-tight">
              {user?.firstName || 'Admin'}
            </p>
            <p className="text-xs text-[var(--admin-text-muted)]">
              {user?.email || 'admin@kresla.uz'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0b3c3c] flex items-center justify-center text-sm font-semibold text-[#5eead4] ring-2 ring-[var(--admin-border)]">
            {(user?.firstName?.[0] || 'A').toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
