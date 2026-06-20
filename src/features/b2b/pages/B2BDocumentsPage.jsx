import { FileText } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { B2B_DOCUMENTS } from '../data/b2bContent'
import VerificationPending from '../components/registration/VerificationPending'

export default function B2BDocumentsPage() {
  const { profile } = useOutletContext()

  if (profile?.status !== 'verified') {
    return <VerificationPending profile={profile} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-kresla-dark">Contracts & Documents</h2>
        <p className="text-sm text-gray-600 mt-1">Download templates for invoicing, contracts, and payment terms.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {B2B_DOCUMENTS.map((doc) => (
          <a
            key={doc.name}
            href={doc.href}
            className="flex items-center gap-4 rounded-xl border border-[#0b3c3c]/10 bg-white p-5 hover:border-kresla-primary/40 transition"
          >
            <div className="rounded-lg bg-kresla-primary/10 p-3">
              <FileText className="w-6 h-6 text-kresla-primary" />
            </div>
            <div>
              <p className="font-medium text-kresla-dark">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.type} · Download</p>
            </div>
          </a>
        ))}
      </div>

      <div className="rounded-xl bg-[#f4f7f7] border border-[#0b3c3c]/10 p-6">
        <h3 className="font-semibold text-kresla-dark">Payment & Credit Terms</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li><strong>Prepay:</strong> Bank transfer before production/shipment</li>
          <li><strong>Net 30:</strong> Invoice due within 30 days (credit approval required)</li>
          <li><strong>Net 60:</strong> Available for premium tier partners with order history</li>
          <li><strong>PO tracking:</strong> Include your purchase order number at checkout</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Current terms: <strong className="text-kresla-dark uppercase">{profile.creditTerms?.replace('_', ' ')}</strong>
          {profile.creditLimit > 0 && (
            <> · Credit limit: {profile.creditLimit.toLocaleString()} UZS</>
          )}
        </p>
      </div>
    </div>
  )
}
