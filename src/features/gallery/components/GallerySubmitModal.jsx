import { useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../../kresla/context/ToastContext'

const FIELDS = [
  { key: 'name', label: 'Ism' },
  { key: 'city', label: 'Shahar' },
  { key: 'product', label: 'Mahsulot' },
]

export default function GallerySubmitModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', city: '', product: '' })
  const [errors, setErrors] = useState({})

  if (!open) return null

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Ism kiriting'
    if (!form.city.trim()) next.city = 'Shahar kiriting'
    if (!form.product.trim()) next.product = 'Mahsulot kiriting'
    setErrors(next)
    if (Object.keys(next).length) return

    toast.success("Rahmat! Tez orada ko'rib chiqamiz.")
    setForm({ name: '', city: '', product: '' })
    setErrors({})
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b3c3c]/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-submit-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#0b3c3c]/10 bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#6b6b6b] transition-colors hover:bg-[#f5f5f5] hover:text-[#0b3c3c]"
          aria-label="Yopish"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <h2 id="gallery-submit-title" className="font-[Poppins] text-xl font-semibold text-[#1a1a1a] pr-8">
          O&apos;z xonangizni yuboring
        </h2>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Oldin va keyin rasmlaringizni ulashing — galereyada joylashtiramiz.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`gallery-${key}`} className="sr-only">
                {label}
              </label>
              <input
                id={`gallery-${key}`}
                placeholder={label}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border border-[#0b3c3c]/15 px-4 py-2.5 text-sm outline-none transition focus:border-[#0b3c3c] focus:ring-1 focus:ring-[#0b3c3c]/30"
              />
              {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
            </div>
          ))}
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-[#6b6b6b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b3c3c]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#0b3c3c]"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#0b3c3c]/20 py-2.5 text-sm font-medium text-[#4a4a4a] transition hover:bg-[#fafafa]"
            >
              Bekor
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#0b3c3c] py-2.5 text-sm font-medium text-white transition hover:bg-[#0d4a4a]"
            >
              Yuborish
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
