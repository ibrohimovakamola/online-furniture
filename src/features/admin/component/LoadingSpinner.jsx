function LoadingSpinner({ label = 'Loading...', fullScreen = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-[320px]' : 'py-12'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 rounded-full border-2 border-[var(--admin-border)] border-t-[#5eead4] animate-spin" />
      <p className="text-sm text-[var(--admin-text-muted)]">{label}</p>
    </div>
  )
}

export default LoadingSpinner
