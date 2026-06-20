import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import { useSelector } from 'react-redux'
import AdminPageHeader from '../component/AdminPageHeader'
import AdminImageDropzone from '../component/AdminImageDropzone'
import RichTextEditor from '../component/RichTextEditor'
import LoadingSpinner from '../component/LoadingSpinner'
import { selectUser } from '@/features/auth'
import {
  adminBlogApi,
  calcReadTime,
  calcSeoScore,
  slugifyTitle,
} from '../services/adminBlogApi'

const EMPTY = {
  title: '',
  slug: '',
  category: 'Maslahat',
  content: '',
  metaDescription: '',
  keywords: '',
  status: 'draft',
  publishedAt: '',
  featuredImage: '',
}

export default function BlogEditorAdmin() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const user = useSelector(selectUser)

  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const autoSaveRef = useRef(null)

  const draftKey = isEdit ? `blog-draft-${id}` : 'blog-draft-new'

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await adminBlogApi.listCategories()
      setCategories(data.categories || [])
    } catch {
      setCategories([])
    }
  }, [])

  const loadPost = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const { data } = await adminBlogApi.getPost(id)
      const p = data.post
      setForm({
        title: p.title || '',
        slug: p.slug || '',
        category: p.category || 'Maslahat',
        content: p.content || '',
        metaDescription: p.metaDescription || '',
        keywords: (p.keywords || []).join(', '),
        status: p.status || 'draft',
        publishedAt: p.publishedAt ? p.publishedAt.slice(0, 16) : '',
        featuredImage: p.featuredImage || p.image || '',
      })
      setSlugManual(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load post')
      navigate('/admin/blog')
    } finally {
      setLoading(false)
    }
  }, [id, isEdit, navigate])

  useEffect(() => {
    loadCategories()
    if (isEdit) loadPost()
    else {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        try {
          setForm({ ...EMPTY, ...JSON.parse(saved) })
        } catch {
          /* ignore */
        }
      }
    }
  }, [draftKey, isEdit, loadCategories, loadPost])

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (!form.title && !form.content) return
      localStorage.setItem(draftKey, JSON.stringify(form))
    }, 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [form, draftKey])

  const readTime = useMemo(() => calcReadTime(form.content), [form.content])
  const seoScore = useMemo(
    () =>
      calcSeoScore({
        title: form.title,
        metaDescription: form.metaDescription,
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        slug: form.slug,
      }),
    [form.title, form.metaDescription, form.keywords, form.slug]
  )

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !slugManual) next.slug = slugifyTitle(value)
      return next
    })
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setSaving(true)
    const payload = {
      ...form,
      author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
      keywords: form.keywords,
      publishedAt: form.publishedAt || undefined,
    }

    try {
      if (isEdit) {
        await adminBlogApi.updatePost(id, payload, imageFile)
        toast.success('Post updated')
      } else {
        const { data } = await adminBlogApi.createPost(payload, imageFile)
        toast.success('Post created')
        localStorage.removeItem(draftKey)
        navigate(`/admin/blog/edit/${data.post.id}`, { replace: true })
        return
      }
      localStorage.removeItem(draftKey)
      setImageFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading post…" />

  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => c.name)
      : ['Maslahat', 'Trend', "Qo'llanma", 'Dizayn']

  return (
    <div>
      <AdminPageHeader
        title={isEdit ? 'Edit post' : 'New post'}
        subtitle="Blog maqola yaratish va tahrirlash"
      >
        <Link to="/admin/blog" className="admin-btn admin-btn--ghost">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        {form.status === 'published' && form.slug && (
          <a
            href={`/blog/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn--ghost"
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>
        )}
        <button type="button" className="admin-btn admin-btn--primary" disabled={saving} onClick={handleSubmit}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="admin-field">
            <label htmlFor="blog-title">Title *</label>
            <input
              id="blog-title"
              maxLength={100}
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
            />
            <p className="text-xs text-[var(--admin-text-subtle)] mt-1">{form.title.length}/100</p>
          </div>

          <div className="admin-field">
            <label htmlFor="blog-slug">Slug / URL</label>
            <input
              id="blog-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                setField('slug', e.target.value)
              }}
            />
          </div>

          <div className="admin-field">
            <span>Content *</span>
            <RichTextEditor value={form.content} onChange={(html) => setField('content', html)} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="admin-card p-4 space-y-4">
            <div className="admin-field">
              <label htmlFor="blog-status">Status</label>
              <select id="blog-status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="blog-category">Category</label>
              <select id="blog-category" value={form.category} onChange={(e) => setField('category', e.target.value)}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(form.status === 'scheduled' || form.status === 'published') && (
              <div className="admin-field">
                <label htmlFor="blog-date">Publication date</label>
                <input
                  id="blog-date"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => setField('publishedAt', e.target.value)}
                />
              </div>
            )}

            <p className="text-sm text-[var(--admin-text-subtle)]">
              Reading time: <strong>{readTime} min</strong> (auto)
            </p>
          </div>

          <div className="admin-card p-4">
            <AdminImageDropzone
              label="Featured image"
              value={imageFile || form.featuredImage}
              onChange={setImageFile}
            />
          </div>

          <div className="admin-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div className="admin-field">
              <label htmlFor="blog-meta">Meta description</label>
              <textarea
                id="blog-meta"
                rows={3}
                maxLength={160}
                value={form.metaDescription}
                onChange={(e) => setField('metaDescription', e.target.value)}
              />
              <p className="text-xs text-[var(--admin-text-subtle)]">{form.metaDescription.length}/160</p>
            </div>
            <div className="admin-field">
              <label htmlFor="blog-keywords">Keywords</label>
              <input
                id="blog-keywords"
                placeholder="mebel, divan, dizayn"
                value={form.keywords}
                onChange={(e) => setField('keywords', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>SEO score</span>
              <span
                className={`font-bold ${seoScore >= 70 ? 'text-emerald-500' : seoScore >= 40 ? 'text-amber-500' : 'text-red-400'}`}
              >
                {seoScore}/100
              </span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
