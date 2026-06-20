import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  Images,
  Building2,
  HelpCircle,
  FileText,
  ChevronDown,
  Plus,
  FolderOpen,
  BarChart2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { selectUser } from '@/features/auth'
import { ADMIN_ROUTE_PERMISSIONS, roleHasPermission, PERMISSIONS } from '@/features/auth'

const links = [
  { nameKey: 'sidebar.dashboard', path: '/admin', icon: LayoutDashboard },
  { nameKey: 'sidebar.products', path: '/admin/products', icon: Armchair },
  { nameKey: 'sidebar.categories', path: '/admin/categories', icon: Layers },
  { nameKey: 'sidebar.orders', path: '/admin/orders', icon: ShoppingBag },
  { nameKey: 'sidebar.customers', path: '/admin/customers', icon: Users },
  { nameKey: 'sidebar.flashSale', path: '/admin/flash-sale', icon: Zap },
  { nameKey: 'sidebar.gallery', path: '/admin/gallery', icon: Images },
  { nameKey: 'sidebar.b2bLeads', path: '/admin/b2b-leads', icon: Building2 },
  { nameKey: 'sidebar.faq', path: '/admin/faq', icon: HelpCircle },
  { nameKey: 'sidebar.pages', path: '/admin/pages', icon: FileText },
  { nameKey: 'sidebar.analytics', path: '/admin/analytics', icon: LineChart },
  { nameKey: 'sidebar.settings', path: '/admin/settings', icon: Settings },
]

const blogLinks = [
  { nameKey: 'sidebar.blogAllPosts', path: '/admin/blog', icon: FileText, end: true },
  { nameKey: 'sidebar.blogNewPost', path: '/admin/blog/new', icon: Plus },
  { nameKey: 'sidebar.blogCategories', path: '/admin/blog/categories', icon: FolderOpen },
  { nameKey: 'sidebar.blogAnalytics', path: '/admin/blog/analytics', icon: BarChart2 },
]

function AdminSidebar({ isOpen, onNavigate }) {
  const { t } = useTranslation('admin')
  const user = useSelector(selectUser)
  const location = useLocation()
  const blogActive = location.pathname.startsWith('/admin/blog')
  const [blogOpen, setBlogOpen] = useState(blogActive)

  const canManageBlog = roleHasPermission(user?.role, PERMISSIONS.MANAGE_BLOG)

  const visibleLinks = links.filter((item) => {
    const permission = ADMIN_ROUTE_PERMISSIONS[item.path]
    if (permission === null || permission === undefined) return true
    return roleHasPermission(user?.role, permission)
  })

  const visibleBlogLinks = blogLinks.filter((item) => {
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
              {t('brand')}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
              {t('panel')}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {visibleLinks.slice(0, 6).map((link) => {
          const LinkIcon = link.icon
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar-nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5eead4]/15 text-[#5eead4] shadow-sm shadow-black/10'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LinkIcon
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-[#5eead4]' : 'text-white/60 group-hover:text-white'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span>{t(link.nameKey)}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}

        {canManageBlog && visibleBlogLinks.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setBlogOpen((o) => !o)}
              className={`sidebar-nav-link group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                blogActive
                  ? 'bg-[#5eead4]/15 text-[#5eead4]'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <FileText
                className={`h-[18px] w-[18px] shrink-0 ${
                  blogActive ? 'text-[#5eead4]' : 'text-white/60 group-hover:text-white'
                }`}
                strokeWidth={1.75}
              />
              <span>{t('sidebar.blog')}</span>
              <ChevronDown
                className={`ml-auto h-4 w-4 transition-transform ${blogOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {blogOpen && (
              <div className="mt-1 ml-3 space-y-0.5 border-l border-white/10 pl-3">
                {visibleBlogLinks.map((link) => {
                  const LinkIcon = link.icon
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end={link.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'text-[#5eead4] bg-white/5'
                            : 'text-white/55 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <LinkIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      {t(link.nameKey)}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {visibleLinks.slice(6).map((link) => {
          const LinkIcon = link.icon
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar-nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5eead4]/15 text-[#5eead4] shadow-sm shadow-black/10'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LinkIcon
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-[#5eead4]' : 'text-white/60 group-hover:text-white'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span>{t(link.nameKey)}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 mx-4 mb-6 rounded-xl bg-white/5 border border-white/8">
        <p className="text-xs text-white/50 mb-1">{t('signedInAs')}</p>
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
