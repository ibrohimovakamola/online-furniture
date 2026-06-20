import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import B2BTierBadge, { VerifiedBadge } from '../components/B2BTierBadge'
import RecentOrdersWidget from '../components/dashboard/RecentOrdersWidget'
import FavoriteProductsWidget from '../components/dashboard/FavoriteProductsWidget'
import AccountMessagesWidget from '../components/dashboard/AccountMessagesWidget'
import CreditStatusWidget from '../components/dashboard/CreditStatusWidget'
import AnalyticsWidget from '../components/dashboard/AnalyticsWidget'
import { useB2BCart } from '../hooks/useB2BCart'
import { formatSom } from '@/features/kresla/utils/formatPrice'
import { calculateB2BLinePrice } from '../utils/pricing'

export default function B2BDashboardPage() {
  const { profile } = useOutletContext()
  const { addItem } = useB2BCart()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [favorites, setFavorites] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      b2bApi.getDashboardStats(),
      b2bApi.getRecentOrders({ limit: 8 }),
      b2bApi.getFavorites(),
      b2bApi.getAnalytics(),
    ])
      .then(([s, o, f, a]) => {
        setStats(s.data.stats)
        setOrders(o.data.orders || [])
        setFavorites(f.data.favorites || [])
        setAnalytics(a.data.analytics)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const handleInvoice = async (orderId) => {
    try {
      const { data: gen } = await b2bApi.generateInvoice({ orderId })
      const invoiceId = gen.invoice?.id || gen.invoice?._id
      if (!invoiceId) throw new Error('No invoice')
      const { data } = await b2bApi.downloadInvoice(invoiceId)
      const url = window.URL.createObjectURL(new Blob([data], { type: 'text/html' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${orderId}.html`
      a.click()
    } catch {
      toast.error('Could not download invoice')
    }
  }

  const addFavoriteToCart = (product) => {
    const pricing = calculateB2BLinePrice({
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      quantity: 1,
    })
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.mainImage,
      unitPrice: pricing.unitPrice,
      retailPrice: product.retailPrice,
      quantity: 1,
    })
    toast.success('Added to cart')
  }

  const toggleFavorite = async (productId, isFav) => {
    try {
      if (isFav) await b2bApi.removeFavorite(productId)
      else await b2bApi.addFavorite(productId)
      const { data } = await b2bApi.getFavorites()
      setFavorites(data.favorites || [])
    } catch {
      toast.error('Favorite update failed')
    }
  }

  return (
    <B2BVerifiedGate>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-kresla-dark">
              Welcome, {profile?.companyName}!
            </h2>
            <p className="text-gray-600 mt-1">Your B2B partner dashboard</p>
          </div>
          <VerifiedBadge />
          <B2BTierBadge tier={profile?.tier} />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "This Month's Orders", value: stats?.monthOrders ?? '—' },
            { label: 'Total Spent YTD', value: stats ? formatSom(stats.ytdSpent) : '—' },
            { label: 'Pending Deliveries', value: stats?.pendingDeliveries ?? '—' },
            { label: 'Available Credit', value: stats ? formatSom(stats.creditAvailable) : '—' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-kresla-dark">{loading ? '…' : s.value}</p>
            </div>
          ))}
        </div>

        <RecentOrdersWidget orders={orders} onDownloadInvoice={handleInvoice} />

        <div className="grid lg:grid-cols-2 gap-6">
          <FavoriteProductsWidget
            favorites={favorites}
            onAddToCart={addFavoriteToCart}
            onRemoveFavorite={(id) => toggleFavorite(id, true)}
          />
          <AccountMessagesWidget profile={profile} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <CreditStatusWidget stats={stats} profile={profile} />
          <AnalyticsWidget analytics={analytics} tier={profile?.tier} />
        </div>
      </div>
    </B2BVerifiedGate>
  )
}
