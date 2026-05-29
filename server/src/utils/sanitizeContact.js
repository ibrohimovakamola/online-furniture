const EMAIL_RE = /^\S+@\S+\.\S+$/

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
}

export function sanitizeContactBody(body = {}) {
  const name = stripHtml(body.name).slice(0, 100)
  const email = stripHtml(body.email).toLowerCase().slice(0, 120)
  const phone = String(body.phone || '')
    .replace(/[^\d+\s()-]/g, '')
    .trim()
    .slice(0, 30)
  const message = stripHtml(body.message).slice(0, 2000)

  return { name, email, phone, message }
}

export function validateContactFields({ name, email, phone, message }) {
  const errors = []

  if (!name || name.length < 2) errors.push('Name must be at least 2 characters')
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required')
  if (!phone || phone.replace(/\D/g, '').length < 7) errors.push('A valid phone number is required')
  if (!message || message.length < 10) errors.push('Message must be at least 10 characters')

  return errors
}
