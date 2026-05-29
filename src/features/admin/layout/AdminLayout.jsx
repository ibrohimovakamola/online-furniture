import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../component/AdminSidebar'
import AdminTopbar from '../component/AdminTopbar'
import {
  AdminSearchProvider,
  loadAdminTheme,
  saveAdminTheme,
  useAdminSearch,
  useDebouncedValue,
} from '../context/AdminSearchContext'
import {
  fetchCategories,
  fetchDashboardStats,
  fetchOrders,
  fetchProducts,
} from '../store/adminSlice'
import '../../../assets/styles/admin.scss'

function AdminLayoutInner() {
  const dispatch = useDispatch()
  const { dateRange, searchQuery, setPendingOrdersCount } = useAdminSearch()
  const debouncedSearch = useDebouncedValue(searchQuery)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(loadAdminTheme)

  useEffect(() => {
    dispatch(fetchCategories(''))
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchDashboardStats(dateRange))
  }, [dispatch, dateRange])

  useEffect(() => {
    dispatch(fetchProducts({ search: debouncedSearch, dateRange }))
  }, [dispatch, debouncedSearch, dateRange])

  useEffect(() => {
    dispatch(fetchOrders({ search: debouncedSearch, dateRange })).then((result) => {
      if (fetchOrders.fulfilled.match(result)) {
        const pending = (result.payload || []).filter(
          (o) => o.status === 'pending' || o.status === 'processing'
        ).length
        setPendingOrdersCount(pending)
      }
    })
  }, [dispatch, debouncedSearch, dateRange, setPendingOrdersCount])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      saveAdminTheme(next)
      return next
    })
  }

  return (
    <div className={`admin-shell ${theme === 'light' ? 'admin-theme-light' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="admin-main flex-1 min-h-screen min-w-0 flex flex-col">
        <AdminTopbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="admin-content flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-10">
          <div className="admin-content-inner mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'light' ? '#fff' : '#1a2626',
            color: theme === 'light' ? '#0f1a1a' : '#f0f4f4',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#5eead4', secondary: '#0b3c3c' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1a2626' } },
        }}
      />
    </div>
  )
}

function AdminLayout() {
  return (
    <AdminSearchProvider>
      <AdminLayoutInner />
    </AdminSearchProvider>
  )
}

export default AdminLayout
