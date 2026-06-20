import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Upload, X } from 'lucide-react'

export default function AdminImageDropzone({
  label,
  hint = 'PNG, JPG up to 5MB',
  value,
  onChange,
  required = false,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const applyFile = useCallback(
    (file) => {
      if (!file?.type?.startsWith('image/')) return
      onChange(file)
    },
    [onChange]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    applyFile(file)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const preview = typeof value === 'string' ? value : value ? URL.createObjectURL(value) : null

  return (
    <div className="admin-field">
      <span>
        {label}
        {required && <span className="text-[var(--admin-danger)]"> *</span>}
      </span>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative mt-1 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-all ${
          dragOver
            ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]'
            : 'border-[var(--admin-border-strong)] bg-[var(--admin-bg-elevated)] hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => applyFile(e.target.files?.[0])}
        />

        {preview ? (
          <>
            <div className="admin-image-slot h-24 w-full max-w-[200px] mb-2">
              <img src={preview} alt="" />
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--icon absolute right-2 top-2"
              onClick={clear}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-accent-soft)]">
              <ImagePlus className="h-6 w-6 text-[var(--admin-accent)]" strokeWidth={1.5} />
            </div>
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--admin-text)]">
              <Upload className="h-4 w-4 text-[var(--admin-accent)]" />
              Drop image or click to upload
            </p>
            <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">{hint}</p>
          </>
        )}
      </div>
    </div>
  )
}
