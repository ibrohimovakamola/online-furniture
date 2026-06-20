import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

const STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-kresla-primary text-white',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 3000)
    return id
  }, [dismiss])

  const value = useMemo(
    () => ({
      toast: {
        success: (msg) => push(msg, 'success'),
        error: (msg) => push(msg, 'error'),
        info: (msg) => push(msg, 'info'),
      },
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${STYLES[t.type] || STYLES.info}`}
            role="status"
          >
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
