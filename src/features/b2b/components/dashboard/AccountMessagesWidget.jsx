import { B2B_ANNOUNCEMENTS, DEFAULT_ACCOUNT_MANAGER } from '../../data/b2bContent'

export default function AccountMessagesWidget({ profile }) {
  const manager = profile?.accountManager?.name ? profile.accountManager : DEFAULT_ACCOUNT_MANAGER

  return (
    <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5 h-full">
      <h3 className="font-semibold text-kresla-dark mb-4">Account Messages</h3>
      <div className="rounded-lg bg-[#f4f7f7] p-4 mb-4">
        <p className="text-xs font-semibold uppercase text-kresla-primary">From your account manager</p>
        <p className="mt-1 text-sm font-medium text-kresla-dark">{manager.name}</p>
        <p className="text-sm text-gray-600 mt-1">
          Welcome to Exclusive B2B! Reach me anytime for project quotes or custom MOQ requests.
        </p>
        <a href={`mailto:${manager.email}`} className="inline-block mt-2 text-xs font-semibold text-kresla-primary">
          Reply via email →
        </a>
      </div>
      <ul className="space-y-3">
        {B2B_ANNOUNCEMENTS.map((msg) => (
          <li key={msg.id} className="text-sm border-b border-gray-100 pb-3 last:border-0">
            <p className="font-medium text-kresla-dark">{msg.title}</p>
            <p className="text-gray-600 mt-0.5">{msg.body}</p>
            <p className="text-xs text-gray-400 mt-1">{msg.date}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
