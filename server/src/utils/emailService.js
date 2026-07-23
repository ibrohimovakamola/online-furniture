import nodemailer from 'nodemailer'
import { logApp } from './appLogger.js'

const SMTP_FROM =
  process.env.SMTP_FROM ||
  process.env.MAIL_FROM ||
  (process.env.EMAIL_USER
    ? `Mebel Sotish <${process.env.EMAIL_USER}>`
    : 'Mebel Sotish <noreply@mebelsotish.uz>')

/** @type {import('nodemailer').Transporter | null} */
let transporter = null

function resolveSmtpAuth() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
  return user && pass ? { user, pass } : null
}

export function isEmailConfigured() {
  const auth = resolveSmtpAuth()
  if (process.env.EMAIL_SERVICE === 'gmail' && auth) return true
  return Boolean(process.env.SMTP_HOST && auth)
}

/** @deprecated use isEmailConfigured */
export function isSmtpConfigured() {
  return isEmailConfigured()
}

export function getDefaultFromAddress() {
  return SMTP_FROM
}

export function getB2BAdminEmail() {
  return process.env.B2B_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'b2b@kresla.uz'
}

function getTransporter() {
  if (!isEmailConfigured()) return null
  if (transporter) return transporter

  const auth = resolveSmtpAuth()

  if (process.env.EMAIL_SERVICE === 'gmail' && !process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth,
    })
    return transporter
  }

  const port = Number(process.env.SMTP_PORT) || 587
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth,
  })
  return transporter
}

/**
 * @param {{ to: string | string[], subject: string, html: string, text?: string, from?: string }} opts
 */
export async function sendRawEmail({ to, subject, html, text, from }) {
  const recipients = Array.isArray(to) ? to : [to]
  const payload = {
    from: from || SMTP_FROM,
    to: recipients.join(', '),
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  }

  const transport = getTransporter()
  if (transport) {
    await transport.sendMail(payload)
    return { sent: true, channel: 'smtp' }
  }

  logApp('info', '[emailService] Email (dev / SMTP not configured)', {
    to: recipients.join(', '),
    subject,
    bodyPreview: `${payload.text.slice(0, 400)}${payload.text.length > 400 ? '…' : ''}`,
  })
  return { sent: true, channel: 'console' }
}

export async function sendRawEmailWithRetry(opts, retries = 3) {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      return await sendRawEmail(opts)
    } catch (err) {
      lastError = err
      logApp('error', `[emailService] attempt ${i + 1}/${retries} failed`, { message: err.message })
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}

/** Fire-and-forget — never blocks or throws to caller */
export function queueEmail(opts) {
  sendRawEmailWithRetry(opts).catch((err) =>
    logApp('error', '[emailService] queue failed', { message: err.message })
  )
}
