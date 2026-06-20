import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, FileText, CalendarClock, BarChart3 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import LoadingSpinner from '../component/LoadingSpinner'
import StatCard from '../component/StatCard'
import { adminBlogApi } from '../services/adminBlogApi'

export default function BlogAnalyticsAdmin() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminBlogApi
      .getAnalytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label="Loading blog analytics…" fullScreen />

  const topPosts = analytics?.topPosts || []

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Blog analytics" subtitle="Views and publishing overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total posts" value={String(analytics?.total ?? 0)} icon={FileText} />
        <StatCard title="Published" value={String(analytics?.published ?? 0)} icon={BarChart3} />
        <StatCard title="Drafts" value={String(analytics?.drafts ?? 0)} icon={FileText} />
        <StatCard title="Total views" value={String(analytics?.totalViews ?? 0)} icon={Eye} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Scheduled posts
          </h3>
          <p className="text-3xl font-bold text-[var(--admin-text)]">{analytics?.scheduled ?? 0}</p>
          <p className="text-sm text-[var(--admin-text-muted)] mt-1">
            Posts waiting for their publication date
          </p>
        </div>

        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold mb-4">Top posts by views</h3>
          {topPosts.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">No view data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topPosts.map((post, i) => (
                <li
                  key={post.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-[var(--admin-border)] last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[var(--admin-text-subtle)] mr-2">#{i + 1}</span>
                    <Link
                      to={`/admin/blog/edit/${post.id}`}
                      className="text-sm font-medium text-[var(--admin-text)] hover:text-[var(--admin-accent)] truncate inline-block max-w-full"
                    >
                      {post.title}
                    </Link>
                  </div>
                  <span className="text-sm tabular-nums text-[var(--admin-text-muted)] shrink-0">
                    {post.viewCount} views
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
