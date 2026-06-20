import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import BlogPostTable from '../component/BlogPostTable'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import { adminBlogApi } from '../services/adminBlogApi'
import useDebouncedValue from '@/hook/useDebouncedValue'


const LIMIT_OPTIONS = [10, 25, 50]

export default function BlogsAdmin() {
  const { t } = useTranslation(['adminBlog', 'common'])
  const statusOptions = useMemo(
    () => [
      { value: '', label: t('adminBlog:status.all') },
      { value: 'draft', label: t('adminBlog:status.draft') },
      { value: 'published', label: t('adminBlog:status.published') },
      { value: 'scheduled', label: t('adminBlog:status.scheduled') },
    ],
    [t]
  )
  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: t('adminBlog:filters.sortNewest') },
      { value: 'oldest', label: t('adminBlog:filters.sortOldest') },
      { value: 'title', label: t('adminBlog:filters.sortTitle') },
      { value: 'views', label: t('adminBlog:filters.sortViews') },
    ],
    [t]
  )
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search, 350)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminBlogApi.listPosts({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: category || undefined,
        status: status || undefined,
        sort,
      })
      setPosts(data.posts || [])
      setPagination(data.pagination || { page: 1, limit, total: 0, pages: 1 })
      setSelected(new Set())
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, category, status, sort])

  useEffect(() => {
    adminBlogApi.listCategories().then(({ data }) => setCategories(data.categories || [])).catch(() => {})
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, status, sort, limit])

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = (checked) => {
    setSelected(checked ? new Set(posts.map((p) => p.id)) : new Set())
  }

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await adminBlogApi.patchStatus(id, nextStatus)
      toast.success('Status updated')
      fetchPosts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await adminBlogApi.deletePost(deleteTarget.id)
      toast.success('Post deleted')
      setDeleteTarget(null)
      fetchPosts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    setBusy(true)
    try {
      const { data } = await adminBlogApi.bulkDelete([...selected])
      toast.success(data.message || 'Posts deleted')
      setBulkDeleteOpen(false)
      fetchPosts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed')
    } finally {
      setBusy(false)
    }
  }

  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => c.name)
      : ['Maslahat', 'Trend', "Qo'llanma", 'Dizayn']

  return (
    <div>
      <AdminPageHeader title={t('adminBlog:title')} subtitle={t('adminBlog:subtitle')}>
        {selected.size > 0 && (
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('common:buttons.delete')} ({selected.size})
          </button>
        )}
        <Link to="/admin/blog/new" className="admin-btn admin-btn--primary">
          <Plus className="h-4 w-4" />
          {t('adminBlog:addNew')}
        </Link>
      </AdminPageHeader>

      <div className="admin-card p-4 mt-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
            <input
              type="search"
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[140px]">
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-w-[140px]">
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-w-[140px]">
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="min-w-[100px]">
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading posts…" />
        ) : posts.length === 0 ? (
          <p className="py-12 text-center text-[var(--admin-text-muted)]">No posts found.</p>
        ) : (
          <BlogPostTable
            posts={posts}
            selected={selected}
            onToggle={toggleSelect}
            onToggleAll={toggleAll}
            onStatusChange={handleStatusChange}
            onDelete={setDeleteTarget}
          />
        )}

        {!loading && pagination.pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--admin-border)]">
            <p className="text-sm text-[var(--admin-text-muted)]">
              {pagination.total} post{pagination.total !== 1 ? 's' : ''} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-sm tabular-nums px-2">
                {page} / {pagination.pages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete post?"
        message={`"${deleteTarget?.title}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={busy}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected posts?"
        message={`${selected.size} post(s) will be permanently removed.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        loading={busy}
      />
    </div>
  )
}
