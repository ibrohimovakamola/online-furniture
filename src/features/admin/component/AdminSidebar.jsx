import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard,
  Armchair,
  Layers,
  ShoppingBag,
  Users,
  Zap,
  LineChart,
  Settings,
  Gem,
} from 'lucide-react'
import { selectUser } from '@/features/auth'
import { ADMIN_ROUTE_PERMISSIONS, roleHasPermission } from '@/features/auth'

const links = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Armchair },
  { name: 'Categories', path: '/admin/categories', icon: Layers },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Flash Sale', path: '/admin/flash-sale', icon: Zap },
  { name: 'Analytics', path: '/admin/analytics', icon: LineChart },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
]

function AdminSidebar({ isOpen, onNavigate }) {
  const user = useSelector(selectUser)

  const visibleLinks = links.filter((item) => {
    const permission = ADMIN_ROUTE_PERMISSIONS[item.path]
    if (permission === null || permission === undefined) return true
    return roleHasPermission(user?.role, permission)
  })

  return (
    <aside
      className={`admin-sidebar w-[var(--admin-sidebar-width)] shrink-0 flex flex-col min-h-screen bg-[#0b3c3c] border-r border-white/5 lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-50 ${
        isOpen ? 'is-open' : ''
      }`}
    >
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Gem className="h-5 w-5 text-[#5eead4]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Exclusive
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
              Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {visibleLinks.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            end={path === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-nav-link group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#5eead4]/15 text-[#5eead4] shadow-sm shadow-black/10'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-[#5eead4]' : 'text-white/60 group-hover:text-white'
                  }`}
                  strokeWidth={1.75}
                />
                <span>{name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mx-4 mb-6 rounded-xl bg-white/5 border border-white/8">
        <p className="text-xs text-white/50 mb-1">Signed in as</p>
        <p className="text-sm font-medium text-white truncate">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-[#5eead4]/80 capitalize mt-0.5">
          {user?.role?.replace('_', ' ')}
        </p>
      </div>
    </aside>
  )
}

export default AdminSidebar
