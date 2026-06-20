import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-kresla-primary text-white shadow-lg hover:bg-kresla-accent transition-colors"
      aria-label="Yuqoriga"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
