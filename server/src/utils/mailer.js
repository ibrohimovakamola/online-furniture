import {
  getB2BAdminEmail,
  getDefaultFromAddress,
  isEmailConfigured,
  isSmtpConfigured,
  queueEmail,
  sendRawEmail,
  sendRawEmailWithRetry,
} from './emailService.js'

export {
  getB2BAdminEmail,
  getDefaultFromAddress,
  isEmailConfigured,
  isSmtpConfigured,
  queueEmail,
  sendRawEmail,
  sendRawEmailWithRetry,
}

/** @deprecated legacy Handlebars templates — prefer emailController */
export async function sendEmail(to, _template, data = {}) {
  return sendRawEmail({
    to,
    subject: data.subject || 'Mebel Sotish Notification',
    html: data.html || `<p>${JSON.stringify(data)}</p>`,
  })
}

export async function sendEmailWithRetry(to, template, data = {}, retries = 3) {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      return await sendEmail(to, template, data)
    } catch (err) {
      lastError = err
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}
