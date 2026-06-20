import { Link } from 'react-router-dom'
import { Clock, FileWarning, Mail, RefreshCw } from 'lucide-react'
import B2BStatusBadge from '../B2BStatusBadge'
import { DEFAULT_ACCOUNT_MANAGER, labelForManager } from '../../data/b2bContent'

export default function VerificationPending({ profile, onRefresh }) {
  const manager = profile?.accountManager?.name ? profile.accountManager : DEFAULT_ACCOUNT_MANAGER
  const preferredName = labelForManager(profile?.preferredAccountManager)

  if (profile?.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl border border-red-200 p-8">
        <FileWarning className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <B2BStatusBadge status="rejected" />
        <h2 className="mt-4 text-xl font-semibold text-kresla-dark">Application Not Approved</h2>
        <p className="mt-2 text-gray-600">{profile.rejectedReason || 'Please contact our B2B team for details.'}</p>
        <p className="mt-3 text-sm text-gray-500 flex items-center justify-center gap-1.5">
          <Mail className="w-4 h-4" /> A notification was sent to your registered email.
        </p>
        <Link
          to="/designer-portal/register"
          className="inline-block mt-6 rounded-lg bg-kresla-dark px-6 py-2.5 text-sm font-medium text-white"
        >
          Re-submit Application
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#0b3c3c]/10 p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <B2BStatusBadge status={profile?.status || 'pending'} />
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-sm text-kresla-primary font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refresh status
          </button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="rounded-full bg-amber-100 p-3">
          <Clock className="w-6 h-6 text-amber-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-kresla-dark">Verification in Progress</h2>
          <p className="mt-2 text-gray-600">
            Thank you, <strong>{profile?.companyName}</strong>. We are reviewing your STIR/INN documents and business
            certificates. You will receive an email when your account is approved or if we need more information.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✓ Application received — {profile?.companyName}</li>
            <li>{profile?.registrationCertificateUrl ? '✓' : '○'} Company registration certificate {profile?.registrationCertificateUrl ? 'uploaded' : 'pending'}</li>
            <li>{profile?.licenseDocumentUrl ? '✓' : '○'} Business license {profile?.licenseDocumentUrl ? 'uploaded' : 'pending'}</li>
            <li>○ Admin approval (1–2 business days)</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Confirmation email sent to your registered address.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-[#f4f7f7] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-kresla-primary">Your Account Manager</p>
        <p className="mt-1 font-semibold text-kresla-dark">{manager.name || preferredName}</p>
        <p className="text-sm text-gray-600">{manager.email} · {manager.phone}</p>
        <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Quick response within {manager.responseGuaranteeHours || 2} hours
        </p>
      </div>
    </div>
  )
}
