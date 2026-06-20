import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import { adminApi } from '../services/adminApi'

const emptyForm = {
  slug: '',
  title: '',
  description: '',
  keywords: '',
  content: '',
  published: true,
}

export default function PagesManagement() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.pages.list()
      setPages(data.pages || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCreate = () => {
    setEditingSlug(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (page) => {
    setEditingSlug(page.slug)
    setForm({
      slug: page.slug,
      title: page.title,
      description: page.description || '',
      keywords: (page.keywords || []).join(', '),
      content: page.content,
      published: page.published !== false,
    })
    setModalOpen(true)
  }

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete page "${page.title}" (${page.slug})?`)) return
    try {
      await adminApi.pages.remove(page.slug)
      toast.success('Page deleted')
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const keywords = form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        keywords,
        content: form.content,
        published: form.published,
      }

      if (editingSlug) {
        await adminApi.pages.update(editingSlug, payload)
        toast.success('Page updated')
      } else {
        await adminApi.pages.create({
          ...payload,
          slug: form.slug.trim().toLowerCase(),
        })
        toast.success('Page created')
      }
      setModalOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="CMS Pages"
        subtitle="Privacy policy, terms, returns, about — stored in MongoDB"
      >
        <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New page
        </button>
      </AdminPageHeader>

      <div className="admin-card overflow-hidden p-2 sm:p-4">
        {loading ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">Loading pages…</p>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-4 h-12 w-12 text-[var(--admin-text-subtle)]" strokeWidth={1.25} />
            <p className="text-[var(--admin-text-muted)]">No pages yet.</p>
            <button type="button" className="admin-btn admin-btn--outline mt-4" onClick={openCreate}>
              Create first page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Slug</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Title</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Status</th>
                  <th className="px-4 py-4 text-right text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-[var(--admin-text-muted)]">
                      /{page.slug}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--admin-text)]">{page.title}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          page.published
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-gray-500/15 text-gray-600'
                        }`}
                      >
                        {page.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          onClick={() => openEdit(page)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--icon"
                          onClick={() => handleDelete(page)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          />
          <div className="admin-card relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="mb-6 text-xl font-semibold text-[var(--admin-text)]">
              {editingSlug ? 'Edit page' : 'New page'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingSlug ? (
                <label className="admin-field">
                  <span>Slug *</span>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="privacy-policy"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  />
                  <span className="text-xs text-[var(--admin-text-subtle)]">
                    URL: /privacy-policy maps to slug privacy-policy
                  </span>
                </label>
              ) : null}
              <label className="admin-field">
                <span>Title *</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>SEO description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>Keywords (comma-separated)</span>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>Content (HTML) *</span>
                <textarea
                  required
                  rows={12}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="font-mono text-sm"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                Published
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
