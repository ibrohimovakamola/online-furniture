import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Copy,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import ConfirmDialog from '../component/ConfirmDialog'
import { adminApi } from '../services/adminApi'
import { unwrapListItems } from '../utils/listResponse'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
]

function statusOf(page) {
  return page.status || (page.published ? 'published' : 'draft')
}

function StatusBadge({ status }) {
  const map = {
    published: 'bg-emerald-500/15 text-emerald-400',
    draft: 'bg-slate-500/20 text-slate-300',
    archived: 'bg-amber-500/15 text-amber-400',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || map.draft}`}>
      {status}
    </span>
  )
}

function langSummary(page) {
  const t = page.translations || {}
  const flags = []
  if (t.uz?.title || page.title) flags.push('UZ')
  if (t.ru?.title) flags.push('RU')
  if (t.en?.title) flags.push('EN')
  return flags.join(' / ') || 'UZ'
}

export default function PagesManagement() {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.pages.list({
        search: search.trim() || undefined,
        status: filter !== 'all' ? filter : undefined,
        limit: 100,
      })
      setPages(unwrapListItems(data, 'pages'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => {
    const t = setTimeout(refresh, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [refresh, search])

  const filtered = useMemo(() => {
    // Server already filters by status when requested; keep client filter as safety net
    if (filter === 'all') return pages
    return pages.filter((p) => statusOf(p) === filter)
  }, [pages, filter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await adminApi.pages.remove(deleteTarget.slug)
      toast.success('Page deleted')
      setDeleteTarget(null)
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicate = async (page) => {
    try {
      const { data } = await adminApi.pages.duplicate(page.slug)
      const copy = data.page || data.data?.page
      toast.success('Page duplicated as draft')
      if (copy?.slug) navigate(`/admin/pages/edit/${copy.slug}`)
      else refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duplicate failed')
    }
  }

  const togglePublish = async (page) => {
    const next = statusOf(page) === 'published' ? 'draft' : 'published'
    try {
      await adminApi.pages.update(page.slug, {
        status: next,
        published: next === 'published',
      })
      toast.success(next === 'published' ? 'Page published' : 'Page unpublished')
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="CMS Pages"
        subtitle="Create and manage storefront content pages"
      >
        <Link to="/admin/pages/new" className="admin-btn admin-btn--primary">
          <Plus className="h-4 w-4" />
          New page
        </Link>
      </AdminPageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
          <input
            className="admin-input w-full pl-9"
            placeholder="Search pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search pages"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`admin-btn ${filter === f.id ? 'admin-btn--primary' : 'admin-btn--ghost'} text-sm`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card overflow-hidden p-2 sm:p-4">
        {loading ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">Loading pages…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-4 h-12 w-12 text-[var(--admin-text-subtle)]" strokeWidth={1.25} />
            <p className="text-[var(--admin-text-muted)]">No pages found.</p>
            <Link to="/admin/pages/new" className="admin-btn admin-btn--outline mt-4">
              Create first page
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="px-4 py-3 text-left text-[var(--admin-text-muted)]">Title</th>
                  <th className="px-4 py-3 text-left text-[var(--admin-text-muted)]">Slug</th>
                  <th className="px-4 py-3 text-left text-[var(--admin-text-muted)]">Status</th>
                  <th className="px-4 py-3 text-left text-[var(--admin-text-muted)]">Language</th>
                  <th className="px-4 py-3 text-left text-[var(--admin-text-muted)]">Updated</th>
                  <th className="px-4 py-3 text-right text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((page) => {
                  const status = statusOf(page)
                  return (
                    <tr
                      key={page.id || page.slug}
                      className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--admin-text)]">{page.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--admin-text-muted)]">
                        /{page.slug}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--admin-text-muted)]">
                        {langSummary(page)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--admin-text-muted)]">
                        {page.updatedAt
                          ? new Date(page.updatedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/pages/edit/${page.slug}`}
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            title="Edit"
                            aria-label={`Edit ${page.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/pages/${page.slug}/preview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            title="Preview"
                            aria-label={`Preview ${page.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon"
                            title="Duplicate"
                            aria-label={`Duplicate ${page.title}`}
                            onClick={() => handleDuplicate(page)}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost text-xs px-2"
                            onClick={() => togglePublish(page)}
                          >
                            {status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--icon"
                            title="Delete"
                            aria-label={`Delete ${page.title}`}
                            onClick={() => setDeleteTarget(page)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This action cannot be easily undone. The page will be removed from the CMS."
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
