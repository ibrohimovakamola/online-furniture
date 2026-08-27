import { AlertTriangle } from 'lucide-react'

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading,
  variant = 'danger',
}) {
  if (!open) return null

  const confirmClass =
    variant === 'primary' ? 'admin-btn admin-btn--primary' : 'admin-btn admin-btn--danger'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        className="admin-card relative w-full max-w-md p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              variant === 'primary'
                ? 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                : 'bg-[rgba(248,113,113,0.12)] text-[var(--admin-danger)]'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--admin-text)]">
              {title}
            </h3>
            <p className="text-sm text-[var(--admin-text-muted)] mt-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
