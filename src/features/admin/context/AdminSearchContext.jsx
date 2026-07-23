import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

const AdminSearchContext = createContext(null)

const THEME_KEY = 'kresla-admin-theme'

export const EMPTY_PRODUCT_FILTERS = {
  category: '',
  stockStatus: 'all',
  minPrice: '',
  maxPrice: '',
}

export function AdminSearchProvider({ children }) {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('30days')
  const [productFilters, setProductFilters] = useState(EMPTY_PRODUCT_FILTERS)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  useEffect(() => {
    setSearchQuery('')
  }, [location.pathname])

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      dateRange,
      setDateRange,
      productFilters,
      setProductFilters,
      pendingOrdersCount,
      setPendingOrdersCount,
    }),
    [searchQuery, dateRange, productFilters, pendingOrdersCount]
  )

  return (
    <AdminSearchContext.Provider value={value}>
      {children}
    </AdminSearchContext.Provider>
  )
}

export function useAdminSearch() {
  const ctx = useContext(AdminSearchContext)
  if (!ctx) {
    throw new Error('useAdminSearch must be used within AdminSearchProvider')
  }
  return ctx
}

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export function loadAdminTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveAdminTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}
