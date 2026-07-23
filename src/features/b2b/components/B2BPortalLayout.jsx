import { Link, NavLink, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '@/features/auth/authSlice'
import { ShoppingCart } from 'lucide-react'
import B2BStatusBadge from './B2BStatusBadge'
import { useB2BCart } from '../hooks/useB2BCart'

const NAV = [
  { to: '/designer-portal/dashboard', label: 'Dashboard', verified: true },
  { to: '/designer-portal/catalog', label: 'Catalog', verified: true },
  { to: '/designer-portal/orders', label: 'Orders', verified: true },
  { to: '/designer-portal/cart', label: 'Cart', verified: true, cart: true },
  { to: '/designer-portal/account', label: 'Account', verified: true },
  { to: '/designer-portal/documents', label: 'Documents', verified: true },
  { to: '/designer-portal/register', label: 'Verification', verified: false },
]

export default function B2BPortalLayout({ profile, outletContext }) {
  const user = useSelector(selectUser)
  const { itemCount } = useB2BCart()
  const ctx = outletContext || { profile }
  const verified = profile?.status === 'verified'

  return (
    <div className="min-h-screen bg-[#f4f7f7]">
      <header className="border-b border-[#0b3c3c]/10 bg-white">
        <div className="container mx-auto max-w-[1360px] px-3 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-kresla-primary">Kresla B2B</p>
            <h1 className="text-xl font-semibold text-kresla-dark">Designer & Business Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile && <B2BStatusBadge status={profile.status} />}
            {user && (
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.firstName} {user.lastName}
              </span>
            )}
            {verified && (
              <Link to="/designer-portal/cart" className="relative p-2 rounded-lg border border-[#0b3c3c]/20 hover:bg-gray-50">
                <ShoppingCart className="w-5 h-5 text-kresla-dark" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-kresla-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/"
              className="text-sm font-medium text-kresla-dark border border-[#0b3c3c]/30 rounded px-3 py-1.5 hover:bg-kresla-dark hover:text-white transition"
            >
              Storefront
            </Link>
          </div>
        </div>
        <nav className="container mx-auto max-w-[1360px] px-3 pb-3 flex flex-wrap gap-2">
          {NAV.filter((item) => verified || !item.verified).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-kresla-dark text-white'
                    : 'text-kresla-dark hover:bg-kresla-dark/10'
                }`
              }
            >
              {item.label}
              {item.cart && itemCount > 0 && (
                <span className="bg-kresla-primary text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container mx-auto max-w-[1360px] px-3 py-8">
        <Outlet context={ctx} />
      </main>
    </div>
  )
}
