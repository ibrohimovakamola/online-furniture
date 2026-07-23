import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Building2, FileUp, ShieldCheck } from 'lucide-react'
import { b2bApi } from '../../api/b2bApi'
import {
  B2B_COMPANY_TYPES,
  B2B_EMPLOYEE_RANGES,
  B2B_TURNOVER_RANGES,
  B2B_ACCOUNT_MANAGERS,
} from '../../data/b2bContent'
import { persistAuthSession } from '@/features/auth/authStorage'
import { setAuthSession } from '@/features/auth/authSlice'

const inputClass =
  'w-full rounded-lg border border-[#0b3c3c]/20 bg-white px-3 py-2.5 text-sm text-kresla-dark placeholder:text-gray-400 focus:border-kresla-primary focus:outline-none focus:ring-2 focus:ring-kresla-primary/20'

const acceptDocs = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp'

function FileDropzone({ label, hint, file, onChange, required }) {
  return (
    <label className="flex flex-col items-center justify-center w-full min-h-[110px] rounded-xl border-2 border-dashed border-[#0b3c3c]/25 bg-[#f8fafa] cursor-pointer hover:border-kresla-primary/50 transition">
      <FileUp className="w-7 h-7 text-kresla-primary mb-2" />
      <span className="text-sm font-medium text-kresla-dark text-center px-4">
        {file ? file.name : label}
        {required && !file && ' *'}
      </span>
      <span className="text-xs text-gray-500 mt-1">{hint}</span>
      <input type="file" accept={acceptDocs} className="hidden" required={required && !file} onChange={onChange} />
    </label>
  )
}

export default function B2BRegistrationForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    companyType: 'interior_designer',
    taxId: '',
    registrationNumber: '',
    businessAddress: '',
    postalCode: '',
    website: '',
    phone: '',
    contactTitle: '',
    employeeCount: '',
    annualTurnover: '',
    preferredAccountManager: B2B_ACCOUNT_MANAGERS[0].id,
    message: '',
    acceptTerms: false,
  })
  const [registrationCertificate, setRegistrationCertificate] = useState(null)
  const [licenseFile, setLicenseFile] = useState(null)

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!registrationCertificate || !licenseFile) {
      setError('Both company registration certificate and business license are required.')
      return
    }

    setSubmitting(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, k === 'acceptTerms' ? String(v) : v)
      })
      fd.append('registrationCertificate', registrationCertificate)
      fd.append('licenseDocument', licenseFile)

      const { data } = await b2bApi.register(fd)
      persistAuthSession({ token: data.token, user: data.user })
      dispatch(setAuthSession({ token: data.token, user: data.user }))
      navigate('/designer-portal/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-kresla-primary/10 text-kresla-primary mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-kresla-dark">B2B Registration & Verification</h2>
        <p className="mt-2 text-gray-600 max-w-xl mx-auto">
          Apply for wholesale access. Upload your registration certificate and business license — our team verifies
          within 1–2 business days. You will receive email confirmation when approved.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-8 bg-white rounded-2xl border border-[#0b3c3c]/10 p-6 md:p-8 shadow-sm">
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-kresla-dark mb-4">
            <ShieldCheck className="w-5 h-5 text-kresla-primary" />
            Contact Account
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required className={inputClass} placeholder="First name *" value={form.firstName} onChange={set('firstName')} />
            <input required className={inputClass} placeholder="Last name *" value={form.lastName} onChange={set('lastName')} />
            <input required type="email" className={inputClass} placeholder="Email address *" value={form.email} onChange={set('email')} />
            <input required type="password" minLength={8} className={inputClass} placeholder="Password (min 8) *" value={form.password} onChange={set('password')} />
            <input className={inputClass} placeholder="Job title" value={form.contactTitle} onChange={set('contactTitle')} />
            <input required className={inputClass} placeholder="Phone number *" value={form.phone} onChange={set('phone')} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-kresla-dark mb-4">Company Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              required
              className={`${inputClass} sm:col-span-2`}
              placeholder="Business name (legal company name) *"
              value={form.companyName}
              onChange={set('companyName')}
            />
            <select required className={inputClass} value={form.companyType} onChange={set('companyType')}>
              {B2B_COMPANY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input className={inputClass} placeholder="Website (optional)" value={form.website} onChange={set('website')} />
            <input required className={inputClass} placeholder="Tax ID number (STIR) *" value={form.taxId} onChange={set('taxId')} />
            <input required className={inputClass} placeholder="Registration number (INN) *" value={form.registrationNumber} onChange={set('registrationNumber')} />
            <input required className={`${inputClass} sm:col-span-2`} placeholder="Business address (street, city) *" value={form.businessAddress} onChange={set('businessAddress')} />
            <input required className={inputClass} placeholder="Postal code *" value={form.postalCode} onChange={set('postalCode')} />
            <select required className={inputClass} value={form.employeeCount} onChange={set('employeeCount')}>
              <option value="">Number of employees *</option>
              {B2B_EMPLOYEE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select required className={inputClass} value={form.annualTurnover} onChange={set('annualTurnover')}>
              <option value="">Annual turnover (approx.) *</option>
              {B2B_TURNOVER_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select required className={`${inputClass} sm:col-span-2`} value={form.preferredAccountManager} onChange={set('preferredAccountManager')}>
              {B2B_ACCOUNT_MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>Preferred account manager: {m.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-kresla-dark mb-4">
            <FileUp className="w-5 h-5 text-kresla-primary" />
            Verification Documents
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <FileDropzone
              label="Company registration certificate (PDF)"
              hint="Max 10 MB"
              file={registrationCertificate}
              required
              onChange={(e) => setRegistrationCertificate(e.target.files?.[0] || null)}
            />
            <FileDropzone
              label="Business license (PDF)"
              hint="Max 10 MB"
              file={licenseFile}
              required
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
            />
          </div>
        </section>

        <textarea
          className={`${inputClass} min-h-[100px]`}
          placeholder="Tell us about your projects or expected volume (optional)"
          value={form.message}
          onChange={set('message')}
        />

        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => setForm((p) => ({ ...p, acceptTerms: e.target.checked }))}
            className="mt-1 rounded border-gray-300 text-kresla-primary focus:ring-kresla-primary"
          />
          <span>
            I agree to Kresla B2B Terms & Conditions, credit review, and document verification process.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.acceptTerms}
            className="flex-1 rounded-lg bg-kresla-dark px-6 py-3 text-sm font-semibold text-white hover:bg-kresla-primary transition disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
          <Link
            to="/login"
            className="flex-1 text-center rounded-lg border border-[#0b3c3c]/30 px-6 py-3 text-sm font-medium text-kresla-dark hover:bg-kresla-dark hover:text-white transition"
          >
            Already registered? Log in
          </Link>
        </div>
      </form>
    </div>
  )
}
