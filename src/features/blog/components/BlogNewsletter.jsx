import { useState } from 'react'
import toast from 'react-hot-toast'

export default function BlogNewsletter({ compact = false }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('To‘g‘ri email manzilini kiriting')
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    setSubscribed(true)
    setEmail('')
    toast.success('Obuna muvaffaqiyatli!')
  }

  if (subscribed) {
    return (
      <p className="blog-newsletter__success" role="status">
        Rahmat! Yangi maqolalar haqida xabar beramiz.
      </p>
    )
  }

  return (
    <div className={compact ? '' : 'blog-newsletter blog-sidebar__widget'}>
      {!compact && <h3 className="blog-sidebar__title">Yangiliklar</h3>}
      <p className="blog-newsletter__text">
        Interyer dizayn maslahatlari va maxsus takliflar — haftada bir marta.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="blog-newsletter-email" className="sr-only">
          Email manzil
        </label>
        <input
          id="blog-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          autoComplete="email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Yuborilmoqda…' : 'Obuna bo‘lish'}
        </button>
      </form>
    </div>
  )
}
