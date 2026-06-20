import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, CheckCircle, Eye, Phone, XCircle } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import { useAdminSearch } from '../context/AdminSearchContext'
import { b2bAdminApi } from '@/features/b2b/api/b2bApi'
import { getServerOrigin } from '@/config/apiBase'
import {
  labelForCompanyType,
  labelForEmployees,
  labelForTurnover,
  labelForManager,
} from '@/features/b2b/data/b2bContent'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25' },
  { value: 'under_review', label: 'Under Review', className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25' },
  { value: 'verified', label: 'Verified', className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25' },
  { value: 'rejected', label: 'Rejected', className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
]

function StatusBadge({ status }) {
  const cfg = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function B2BLeads() {
  const { searchQuery } = useAdminSearch()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await b2bAdminApi.listApplications()
      setApplications(data.applications || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load B2B applications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return applications
    return applications.filter(
      (a) =>
        a.companyName?.toLowerCase().includes(q) ||
        a.taxId?.includes(q) ||
        a.user?.email?.toLowerCase().includes(q)
    )
  }, [applications, searchQuery])

  const updateStatus = async (id, status, extra = {}) => {
    try {
      await b2bAdminApi.updateApplication(id, { status, ...extra })
      toast.success(`Application ${status}`)
      refresh()
      setDetail(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const openDetail = (app) => {
    setDetail(app)
    setNotesDraft(app.verificationNotes || '')
  }

  const saveNotes = async () => {
    if (!detail) return
    await b2bAdminApi.updateApplication(detail.id, {
      status: detail.status,
      verificationNotes: notesDraft,
    })
    toast.success('Notes saved')
    refresh()
  }

  const origin = getServerOrigin()

  return (
    <div>
      <AdminPageHeader
        title="B2B Applications"
        subtitle="Review business registrations, verify documents, and approve wholesale access"
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {STATUS_OPTIONS.map((s) => {
          const count = applications.filter((a) => a.status === s.value).length
          return (
            <div key={s.value} className="admin-card flex items-center gap-3 px-4 py-3 min-w-[140px]">
              <Building2 className="h-5 w-5 text-[var(--admin-accent)]" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">{s.label}</p>
                <p className="text-lg font-semibold text-[var(--admin-text)]">{count}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="admin-card overflow-hidden p-2 sm:p-4">
        {loading ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">Loading applications…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">No B2B applications match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Company</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Contact</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">STIR / INN</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Date</th>
                  <th className="px-4 py-4 text-left text-[var(--admin-text-muted)]">Status</th>
                  <th className="px-4 py-4 text-right text-[var(--admin-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]">
                    <td className="px-4 py-4 font-medium">{app.companyName}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">
                      {app.user ? `${app.user.firstName} ${app.user.lastName}` : '—'}
                      <br />
                      <span className="text-xs">{app.user?.email}</span>
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">
                      {app.taxId || '—'} / {app.registrationNumber || '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(app.createdAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="admin-btn admin-btn--ghost admin-btn--icon" onClick={() => openDetail(app)}>
                          <Eye className="h-4 w-4" />
                        </button>
                        {app.status !== 'verified' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon text-emerald-400"
                            title="Approve"
                            onClick={() => updateStatus(app.id, 'verified', { creditTerms: 'net30', creditLimit: 50000000 })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--icon text-red-400"
                            title="Reject"
                            onClick={() => updateStatus(app.id, 'rejected', { rejectedReason: 'Documents could not be verified' })}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)} aria-label="Close" />
          <div className="admin-card relative z-10 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">{detail.companyName}</h2>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
              {detail.user?.firstName} {detail.user?.lastName} · {detail.user?.email}
            </p>
            {detail.phone && (
              <a href={`tel:${detail.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--admin-accent)]">
                <Phone className="h-3.5 w-3.5" /> {detail.phone}
              </a>
            )}
            <p className="mt-4 text-sm">STIR: {detail.taxId || '—'} · INN: {detail.registrationNumber || '—'}</p>
            <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
              {labelForCompanyType(detail.companyType)} · {labelForEmployees(detail.employeeCount)} · {labelForTurnover(detail.annualTurnover)}
            </p>
            {(detail.businessAddress || detail.postalCode) && (
              <p className="mt-2 text-sm">{detail.businessAddress}{detail.postalCode ? `, ${detail.postalCode}` : ''}</p>
            )}
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
              Preferred manager: {labelForManager(detail.preferredAccountManager)}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {detail.registrationCertificateUrl && (
                <a
                  href={`${origin}${detail.registrationCertificateUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--admin-accent)] underline"
                >
                  Registration certificate
                </a>
              )}
              {detail.licenseDocumentUrl && (
                <a
                  href={`${origin}${detail.licenseDocumentUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--admin-accent)] underline"
                >
                  Business license
                </a>
              )}
            </div>
            <div className="mt-4"><StatusBadge status={detail.status} /></div>
            <label className="admin-field mt-6">
              <span>Verification notes</span>
              <textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="admin-input !pl-3 resize-y min-h-[100px]"
              />
            </label>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setDetail(null)}>Close</button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={saveNotes}>Save notes</button>
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => updateStatus(detail.id, 'verified', { verificationNotes: notesDraft, creditTerms: 'net30' })}>
                Approve Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
