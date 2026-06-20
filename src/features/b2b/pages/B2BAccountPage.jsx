import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import {
  B2B_COMPANY_TYPES,
  B2B_DOCUMENTS,
  DEFAULT_ACCOUNT_MANAGER,
} from '../data/b2bContent'
import { useOutletContext } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '@/features/auth/authSlice'

const TABS = ['Company', 'Users', 'Payment', 'Manager', 'Preferences', 'Documents']

export default function B2BAccountPage() {
  const { profile, refresh } = useOutletContext()
  const user = useSelector(selectUser)
  const [tab, setTab] = useState('Company')
  const [account, setAccount] = useState(null)
  const [team, setTeam] = useState([])
  const [settings, setSettings] = useState({ emailNotifications: true, orderUpdates: true, promoAlerts: true, currency: 'UZS' })
  const [companyForm, setCompanyForm] = useState({})
  const [newMember, setNewMember] = useState({ email: '', firstName: '', lastName: '', role: 'buyer' })

  useEffect(() => {
    b2bApi.getAccount().then(({ data }) => {
      setAccount(data.account)
      setCompanyForm({
        companyName: data.account?.companyName || '',
        companyType: data.account?.companyType || 'interior_designer',
        taxId: data.account?.taxId || '',
        businessAddress: data.account?.businessAddress || '',
        postalCode: data.account?.postalCode || '',
        phone: data.account?.phone || '',
        website: data.account?.website || '',
      })
      if (data.account?.settings) setSettings(data.account.settings)
    })
    b2bApi.getTeamMembers?.().then(({ data }) => setTeam(data.teamMembers || [])).catch(() => {})
  }, [])

  const saveCompany = async () => {
    try {
      await b2bApi.updateAccount(companyForm)
      toast.success('Company info saved')
      refresh?.()
    } catch {
      toast.error('Save failed')
    }
  }

  const saveSettings = async () => {
    try {
      await b2bApi.updateSettings(settings)
      toast.success('Preferences saved')
    } catch {
      toast.error('Save failed')
    }
  }

  const addMember = async () => {
    try {
      await b2bApi.addTeamMember(newMember)
      const { data } = await b2bApi.getTeamMembers()
      setTeam(data.teamMembers || [])
      setNewMember({ email: '', firstName: '', lastName: '', role: 'buyer' })
      toast.success('Team member added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    }
  }

  const removeMember = async (idx) => {
    try {
      await b2bApi.removeTeamMember(idx)
      setTeam((t) => t.filter((_, i) => i !== idx))
    } catch {
      toast.error('Remove failed')
    }
  }

  const manager = profile?.accountManager?.name ? profile.accountManager : DEFAULT_ACCOUNT_MANAGER

  return (
    <B2BVerifiedGate>
      <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Account Settings</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-kresla-dark text-white' : 'bg-white border'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white border p-6 max-w-2xl">
        {tab === 'Company' && (
          <div className="space-y-3">
            {['companyName', 'taxId', 'businessAddress', 'postalCode', 'phone', 'website'].map((f) => (
              <input
                key={f}
                placeholder={f}
                value={companyForm[f] || ''}
                onChange={(e) => setCompanyForm((p) => ({ ...p, [f]: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            ))}
            <select value={companyForm.companyType} onChange={(e) => setCompanyForm((p) => ({ ...p, companyType: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">
              {B2B_COMPANY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p className="text-xs text-gray-500">Contact email: {user?.email}</p>
            <button type="button" onClick={saveCompany} className="rounded-lg bg-kresla-dark text-white px-6 py-2 text-sm font-semibold">Save</button>
          </div>
        )}

        {tab === 'Users' && (
          <div className="space-y-4">
            <ul className="divide-y text-sm">
              {team.map((m, idx) => (
                <li key={idx} className="py-2 flex justify-between items-center">
                  <span>{m.firstName} {m.lastName} — {m.email} ({m.role})</span>
                  <button type="button" onClick={() => removeMember(idx)} className="text-red-500 text-xs">Remove</button>
                </li>
              ))}
            </ul>
            <div className="grid sm:grid-cols-2 gap-2">
              <input placeholder="Email" value={newMember.email} onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="First name" value={newMember.firstName} onChange={(e) => setNewMember((p) => ({ ...p, firstName: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Last name" value={newMember.lastName} onChange={(e) => setNewMember((p) => ({ ...p, lastName: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <select value={newMember.role} onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                <option value="admin">Admin</option>
                <option value="buyer">Manager / Buyer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button type="button" onClick={addMember} className="rounded-lg bg-kresla-dark text-white px-4 py-2 text-sm">Add user</button>
          </div>
        )}

        {tab === 'Payment' && (
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt>Credit terms</dt><dd className="font-semibold uppercase">{account?.creditTerms || profile?.creditTerms}</dd></div>
            <div className="flex justify-between"><dt>Credit limit</dt><dd>{account?.creditLimit?.toLocaleString()} UZS</dd></div>
            <div className="flex justify-between"><dt>Current balance</dt><dd>{account?.accountBalance?.toLocaleString()} UZS</dd></div>
            <p className="text-gray-500 pt-4">Bank details and auto-pay setup — contact your account manager.</p>
          </dl>
        )}

        {tab === 'Manager' && (
          <div className="text-sm">
            <p className="font-semibold text-lg">{manager.name}</p>
            <p className="text-gray-600">{manager.title}</p>
            <p className="mt-2">{manager.email} · {manager.phone}</p>
            <a href={`mailto:${manager.email}`} className="inline-block mt-4 text-kresla-primary font-semibold">Send message →</a>
          </div>
        )}

        {tab === 'Preferences' && (
          <div className="space-y-3 text-sm">
            {[
              ['emailNotifications', 'Email notifications'],
              ['orderUpdates', 'Order update emails'],
              ['promoAlerts', 'Promotions & announcements'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={!!settings[key]} onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
            <select value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))} className="w-full rounded-lg border px-3 py-2">
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
            <button type="button" onClick={saveSettings} className="rounded-lg bg-kresla-dark text-white px-6 py-2 text-sm font-semibold">Save preferences</button>
          </div>
        )}

        {tab === 'Documents' && (
          <ul className="space-y-2 text-sm">
            {B2B_DOCUMENTS.map((d) => (
              <li key={d.name}>
                <a href={d.href} className="text-kresla-primary underline">{d.name} ({d.type})</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </B2BVerifiedGate>
  )
}
