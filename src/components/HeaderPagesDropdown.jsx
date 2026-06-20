import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const PAGE_LINKS = [
  { to: '/blog', label: 'Blog' },
  { to: '/flash-sale', label: 'Flash Sale' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/faq', label: 'FAQ' },
  { to: '/showroom', label: 'Virtual showroom' },
]

export default function HeaderPagesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  return (
    <li ref={ref} className="relative list-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="header-menu inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer font-inherit"
      >
        Sahifalar
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full mt-2 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg py-2 z-50">
          {PAGE_LINKS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#0b3c3c] hover:bg-kresla-light hover:text-kresla-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
