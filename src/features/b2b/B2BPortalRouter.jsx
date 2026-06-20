import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { useB2BProfile } from './hooks/useB2BProfile'
import B2BPortalLayout from './components/B2BPortalLayout'
import B2BLandingPage from './pages/B2BLandingPage'
import B2BRegisterPage from './pages/B2BRegisterPage'
import B2BLoginPage from './pages/B2BLoginPage'
import B2BDashboardPage from './pages/B2BDashboardPage'
import B2BCatalogPage from './pages/B2BCatalogPage'
import B2BProductDetailPage from './pages/B2BProductDetailPage'
import B2BCartPage from './pages/B2BCartPage'
import B2BCheckoutPage from './pages/B2BCheckoutPage'
import B2BOrdersPage from './pages/B2BOrdersPage'
import B2BOrderDetailPage from './pages/B2BOrderDetailPage'
import B2BAccountPage from './pages/B2BAccountPage'
import B2BDocumentsPage from './pages/B2BDocumentsPage'

function B2BPortalShell() {
  const isAuth = useSelector(selectIsAuthenticated)
  const { profile, refresh } = useB2BProfile({ enabled: isAuth })

  return (
    <B2BPortalLayout profile={profile} outletContext={{ profile, refresh }} />
  )
}

export default function B2BPortalRouter() {
  return (
    <Routes>
      <Route index element={<B2BLandingPage />} />
      <Route path="register" element={<B2BRegisterPage />} />
      <Route path="login" element={<B2BLoginPage />} />
      <Route element={<B2BPortalShell />}>
        <Route path="dashboard" element={<B2BDashboardPage />} />
        <Route path="catalog" element={<B2BCatalogPage />} />
        <Route path="catalog/:id" element={<B2BProductDetailPage />} />
        <Route path="cart" element={<B2BCartPage />} />
        <Route path="checkout" element={<B2BCheckoutPage />} />
        <Route path="orders" element={<B2BOrdersPage />} />
        <Route path="orders/:orderId" element={<B2BOrderDetailPage />} />
        <Route path="account" element={<B2BAccountPage />} />
        <Route path="documents" element={<B2BDocumentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/designer-portal" replace />} />
    </Routes>
  )
}
