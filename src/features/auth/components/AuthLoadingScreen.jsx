export default function AuthLoadingScreen({ label = 'Checking session…' }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F8F8] text-[#0b3c3c]"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0b3c3c]/20 border-t-[#0b3c3c]" />
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}
