import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import RichTextEditor from '../component/RichTextEditor'
import { adminApi } from '../services/adminApi'
import GooglePreview from './cms/GooglePreview'
import PageBasicInfo from './cms/PageBasicInfo'
import PageLanguageTabs from './cms/PageLanguageTabs'
import PageMedia from './cms/PageMedia'
import PagePublishing from './cms/PagePublishing'
import PageSEO from './cms/PageSEO'
import {
  buildPagePayload,
  emptyPageForm,
  isValidSlug,
  pageFromApi,
  publicPageUrl,
  slugifyTitle,
  stripHtml,
  validatePageForm,
} from './cms/pageEditorUtils'

export default function CMSPageEditor() {
  const { slug: routeSlug } = useParams()
  const isEdit = Boolean(routeSlug)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyPageForm)
  const [lang, setLang] = useState('uz')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const [slugStatus, setSlugStatus] = useState(null)
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [savedLabel, setSavedLabel] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)
  const draftKey = isEdit ? `cms-page-draft-${routeSlug}` : 'cms-page-draft-new'
  const autoSaveRef = useRef(null)

  const locale = useMemo(
    () => form.translations?.[lang] || { title: '', content: '', description: '', seoTitle: '' },
    [form.translations, lang]
  )

  const syncLocaleToForm = useCallback((nextLocale, nextLang = lang) => {
    setForm((prev) => {
      const translations = {
        ...prev.translations,
        [nextLang]: { ...prev.translations[nextLang], ...nextLocale },
      }
      const primary = translations.uz?.title ? translations.uz : nextLocale
      return {
        ...prev,
        translations,
        title: nextLang === 'uz' ? nextLocale.title ?? prev.title : prev.title || primary.title,
        content:
          nextLang === 'uz' ? nextLocale.content ?? prev.content : prev.content || primary.content,
        description:
          nextLang === 'uz'
            ? nextLocale.description ?? prev.description
            : prev.description || primary.description,
        seoTitle:
          nextLang === 'uz'
            ? nextLocale.seoTitle ?? prev.seoTitle
            : prev.seoTitle || primary.seoTitle,
      }
    })
    setDirty(true)
  }, [lang])

  const loadPage = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const { data } = await adminApi.pages.get(routeSlug)
      const page = data.data?.page || data.page
      setForm(pageFromApi(page))
      setSlugManual(true)
      setDirty(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load page')
      navigate('/admin/pages')
    } finally {
      setLoading(false)
    }
  }, [isEdit, navigate, routeSlug])

  useEffect(() => {
    if (isEdit) {
      loadPage()
      return
    }
    const saved = localStorage.getItem(draftKey)
    if (saved) {
      try {
        setForm({ ...emptyPageForm(), ...JSON.parse(saved) })
        setDirty(true)
      } catch {
        /* ignore */
      }
    }
  }, [draftKey, isEdit, loadPage])

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (!form.title && !stripHtml(form.content)) return
      localStorage.setItem(draftKey, JSON.stringify(form))
      setSavedLabel('Saved just now')
    }, 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [form, draftKey])

  useEffect(() => {
    if (!dirty) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const blocker = useBlocker(dirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    const leave = window.confirm('You have unsaved changes. Leave this page?')
    if (leave) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  useEffect(() => {
    if (isEdit || !form.slug || !isValidSlug(form.slug)) {
      setSlugStatus(null)
      return undefined
    }
    const t = setTimeout(async () => {
      setSlugStatus('checking')
      try {
        const { data } = await adminApi.pages.checkSlug(form.slug, routeSlug)
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus(null)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.slug, isEdit, routeSlug])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const onTitleChange = (value) => {
    setForm((prev) => {
      const nextLocale = { ...prev.translations[lang], title: value }
      const translations = { ...prev.translations, [lang]: nextLocale }
      const next = {
        ...prev,
        translations,
        title: lang === 'uz' ? value : prev.title || value,
      }
      if (!isEdit && !slugManual) next.slug = slugifyTitle(value)
      return next
    })
    setDirty(true)
    setErrors((prev) => ({ ...prev, title: undefined }))
  }

  const onSlugChange = (value) => {
    setSlugManual(true)
    setField('slug', slugifyTitle(value) || value.toLowerCase())
  }

  const activeFormForValidation = useMemo(
    () => ({
      ...form,
      title: locale.title || form.title,
      content: locale.content || form.content,
      description: locale.description || form.description,
      seoTitle: locale.seoTitle || form.seoTitle,
    }),
    [form, locale]
  )

  const canPublish = useMemo(() => {
    const errs = validatePageForm(activeFormForValidation)
    return Object.keys(errs).length === 0 && slugStatus !== 'taken'
  }, [activeFormForValidation, slugStatus])

  const persist = async ({ status, stay = true }) => {
    const nextForm = {
      ...activeFormForValidation,
      status,
    }
    const errs = validatePageForm(nextForm)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please fix the errors in the form')
      return null
    }
    if (!isEdit && slugStatus === 'taken') {
      toast.error('This slug is already in use')
      return null
    }

    setSaving(true)
    setSavedLabel('Saving…')
    try {
      const payload = buildPagePayload(nextForm, { lang })
      if (isEdit) {
        await adminApi.pages.update(routeSlug, payload)
        toast.success(status === 'published' ? 'Page published successfully.' : 'Page saved as draft.')
        setDirty(false)
        setForm((prev) => ({ ...prev, status }))
        localStorage.removeItem(draftKey)
        setSavedLabel('Saved just now')
        if (!stay) navigate('/admin/pages')
        return routeSlug
      }

      const { data } = await adminApi.pages.create({
        ...payload,
        slug: nextForm.slug.trim().toLowerCase(),
      })
      const created = data.page || data.data?.page
      toast.success(status === 'published' ? 'Page published successfully.' : 'Page saved as draft.')
      localStorage.removeItem(draftKey)
      setDirty(false)
      setSavedLabel('Saved just now')
      const newSlug = created?.slug || nextForm.slug
      navigate(`/admin/pages/edit/${newSlug}`, { replace: true })
      return newSlug
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => persist({ status: 'draft', stay: true })

  const handlePublishConfirm = async () => {
    setPublishOpen(false)
    await persist({ status: 'published', stay: true })
  }

  const handleUnpublish = () => persist({ status: 'draft', stay: true })

  const handlePreview = async () => {
    let slug = routeSlug || form.slug
    if (dirty || !isEdit) {
      const savedSlug = await persist({
        status: form.status === 'published' ? 'published' : 'draft',
      })
      if (!savedSlug) return
      slug = savedSlug
    }
    window.open(`/admin/pages/${slug}/preview`, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <LoadingSpinner label="Loading page…" />

  return (
    <div className="cms-page-editor">
      <div className="cms-page-editor__toolbar">
        <AdminPageHeader
          title={isEdit ? 'Edit Page' : 'Create New Page'}
          subtitle={
            savedLabel ||
            (isEdit ? `/${routeSlug}` : 'Professional CMS page editor')
          }
        >
          <Link to="/admin/pages" className="admin-btn admin-btn--ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to CMS Pages
          </Link>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handlePreview}>
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--outline"
            disabled={saving}
            onClick={handleSaveDraft}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {form.status === 'published' ? (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={saving}
              onClick={handleUnpublish}
            >
              Unpublish
            </button>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={saving || !canPublish}
            onClick={() => setPublishOpen(true)}
          >
            Publish
          </button>
        </AdminPageHeader>
      </div>

      <div className="mt-4">
        <PageLanguageTabs
          lang={lang}
          translations={form.translations}
          onChange={(code) => setLang(code)}
        />
      </div>

      <div className="cms-editor-grid mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PageBasicInfo
            title={locale.title || form.title}
            slug={form.slug}
            slugManual={slugManual}
            slugStatus={isEdit ? null : slugStatus}
            errors={errors}
            readOnlySlug={isEdit}
            onTitleChange={onTitleChange}
            onSlugChange={onSlugChange}
          />

          <section className="admin-card space-y-3 p-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--admin-text)]">Content Editor</h2>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                Rich text is stored as HTML for the storefront
              </p>
            </div>
            <RichTextEditor
              value={locale.content || form.content}
              onChange={(html) => syncLocaleToForm({ ...locale, content: html })}
              placeholder="Write page content…"
              minHeight={320}
            />
            {errors.content ? (
              <p className="text-xs text-[var(--admin-danger)]" role="alert">
                {errors.content}
              </p>
            ) : null}
          </section>

          <PageSEO
            seoTitle={locale.seoTitle || form.seoTitle}
            description={locale.description || form.description}
            focusKeyword={form.focusKeyword}
            keywords={form.keywords}
            content={locale.content || form.content}
            slug={form.slug}
            onChange={(key, value) => {
              if (key === 'seoTitle' || key === 'description') {
                syncLocaleToForm({ ...locale, [key]: value })
              } else {
                setField(key, value)
              }
            }}
          />

          <GooglePreview
            seoTitle={locale.seoTitle || form.seoTitle}
            title={locale.title || form.title}
            slug={form.slug}
            description={locale.description || form.description}
          />

          <PageMedia
            ogTitle={form.ogTitle}
            ogDescription={form.ogDescription}
            ogImage={form.ogImage}
            onChange={setField}
          />
        </div>

        <PagePublishing
          status={form.status}
          template={form.template}
          slug={form.slug}
          featuredImage={form.featuredImage}
          form={activeFormForValidation}
          onStatusChange={(status) => setField('status', status)}
          onTemplateChange={(template) => setField('template', template)}
          onFeaturedChange={(url) => setField('featuredImage', url)}
          onSaveDraft={handleSaveDraft}
          onPublish={() => setPublishOpen(true)}
          saving={saving}
          canPublish={canPublish}
        />
      </div>

      <ConfirmDialog
        open={publishOpen}
        title="Publish this page?"
        message={`This page will become publicly available at ${publicPageUrl(form.slug)}.`}
        confirmLabel="Publish"
        variant="primary"
        onCancel={() => setPublishOpen(false)}
        onConfirm={handlePublishConfirm}
        loading={saving}
      />
    </div>
  )
}
