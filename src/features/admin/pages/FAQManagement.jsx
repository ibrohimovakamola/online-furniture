import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import { adminApi } from '../services/adminApi'
import { FAQ_CATEGORY_OPTIONS, FAQ_CATEGORY_LABELS } from '@/constants/faqCategories'

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function FAQManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [form, setForm] = useState({
    category: 'general',
    question: '',
    answer: '',
    active: true,
  })
  const [editingId, setEditingId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.faq.list()
      setItems(data.faqs || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load FAQ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev }
      FAQ_CATEGORY_OPTIONS.forEach((c) => {
        if (next[c.id] === undefined) next[c.id] = true
      })
      return next
    })
  }, [])

  const grouped = useMemo(() => {
    const map = new Map()
    items.forEach((item) => {
      const key = item.category
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          title: FAQ_CATEGORY_LABELS[key] || key,
          items: [],
        })
      }
      map.get(key).items.push(item)
    })
    return Array.from(map.values()).map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))
  }, [items])

  const resetForm = () => {
    setForm({
      category: 'general',
      question: '',
      answer: '',
      active: true,
    })
    setEditingId(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required')
      return
    }

    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      active: form.active,
    }

    try {
      if (editingId) {
        await adminApi.faq.update(editingId, payload)
        toast.success('FAQ updated')
      } else {
        await adminApi.faq.create(payload)
        toast.success('FAQ added')
      }
      await refresh()
      resetForm()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      category: item.category,
      question: item.question,
      answer: item.answer,
      active: item.active,
    })
  }

  const toggleActive = async (item) => {
    try {
      await adminApi.faq.update(item.id, { active: !item.active })
      await refresh()
      toast.success(item.active ? 'Hidden on storefront' : 'Published on storefront')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this FAQ?')) return
    try {
      await adminApi.faq.remove(item.id)
      await refresh()
      if (editingId === item.id) resetForm()
      toast.success('FAQ removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="FAQ"
        subtitle="Manage help content shown on the customer FAQ page"
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Live preview by category
          </h2>

          {loading ? (
            <div className="admin-card py-16 text-center text-[var(--admin-text-muted)]">
              Loading…
            </div>
          ) : grouped.length === 0 ? (
            <div className="admin-card flex flex-col items-center py-16 text-center">
              <HelpCircle className="mb-3 h-10 w-10 text-[var(--admin-text-subtle)]" />
              <p className="text-[var(--admin-text-muted)]">No FAQ items yet.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.id} className="admin-card overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--admin-surface-hover)]"
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))
                  }
                >
                  <span className="font-medium text-[var(--admin-text)]">{group.title}</span>
                  <span className="flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
                    {group.items.length} questions
                    {expanded[group.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {expanded[group.id] && (
                  <ul className="border-t border-[var(--admin-border)] divide-y divide-[var(--admin-border)]">
                    {group.items.map((item) => (
                      <li key={item.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[var(--admin-text)]">{item.question}</p>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--admin-text-muted)] line-clamp-3">
                              {item.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-xs font-medium ${
                                item.active ? 'text-emerald-400' : 'text-[var(--admin-text-subtle)]'
                              }`}
                            >
                              {item.active ? 'Public' : 'Hidden'}
                            </span>
                            <ToggleSwitch
                              checked={item.active}
                              onChange={() => toggleActive(item)}
                              label={`Toggle visibility for ${item.question}`}
                            />
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost text-xs !px-3 !py-1.5"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger admin-btn--icon"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>

        <div className="admin-card p-6 h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-[var(--admin-text)] mb-1">
            {editingId ? 'Edit question' : 'Add question'}
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)] mb-6">
            Question min 10 chars, answer min 20 chars.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <label className="admin-field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="admin-input !pl-3"
              >
                {FAQ_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Question *</span>
              <input
                required
                minLength={10}
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                className="admin-input !pl-3"
                placeholder="How long does delivery take?"
              />
            </label>

            <label className="admin-field">
              <span>Answer *</span>
              <textarea
                required
                minLength={20}
                rows={6}
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                className="admin-input !pl-3 resize-y min-h-[140px]"
                placeholder="Delivery within Tashkent typically takes 1–3 business days…"
              />
            </label>

            <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
                {form.active ? (
                  <Eye className="h-4 w-4 text-[var(--admin-accent)]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[var(--admin-text-muted)]" />
                )}
                Public on storefront
              </div>
              <ToggleSwitch
                checked={form.active}
                onChange={(v) => setForm((p) => ({ ...p, active: v }))}
                label="Public on storefront"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button type="submit" className="admin-btn admin-btn--primary w-full">
                <Plus className="h-4 w-4" />
                {editingId ? 'Update FAQ' : 'Add FAQ'}
              </button>
              {editingId && (
                <button type="button" className="admin-btn admin-btn--ghost w-full" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
