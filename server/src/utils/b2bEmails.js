import { getB2BAdminEmail, queueEmail } from './mailer.js'
import { getAccountManagerById } from '../config/b2b.js'

function applicantName(user) {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Applicant'
}

/** Notify admin team when a new B2B application is submitted */
export function emailB2BApplicationSubmitted({ user, profile }) {
  const adminUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  queueEmail({
    to: getB2BAdminEmail(),
    subject: `[B2B] New application — ${profile.companyName}`,
    html: `
      <h2>New B2B Registration</h2>
      <p><strong>Company:</strong> ${profile.companyName}</p>
      <p><strong>Type:</strong> ${profile.companyType}</p>
      <p><strong>Contact:</strong> ${applicantName(user)} &lt;${user.email}&gt;</p>
      <p><strong>Phone:</strong> ${profile.phone || '—'}</p>
      <p><strong>STIR:</strong> ${profile.taxId || '—'} · <strong>INN:</strong> ${profile.registrationNumber || '—'}</p>
      <p><strong>Employees:</strong> ${profile.employeeCount || '—'} · <strong>Turnover:</strong> ${profile.annualTurnover || '—'}</p>
      <p><strong>Preferred manager:</strong> ${profile.preferredAccountManager || '—'}</p>
      <p>Review in the <a href="${adminUrl}/admin/b2b-leads">admin panel</a>.</p>
    `,
  })
}

/** Confirm receipt to applicant */
export function emailB2BApplicationReceived({ user, profile }) {
  queueEmail({
    to: user.email,
    subject: 'B2B application received — Kresla Furniture',
    html: `
      <p>Dear ${applicantName(user)},</p>
      <p>Thank you for registering <strong>${profile.companyName}</strong> for Kresla B2B wholesale access.</p>
      <p>Our team is reviewing your STIR/INN documents and business certificates. You will receive another email once your account is approved (typically 1–2 business days).</p>
      <p>Application reference: ${profile.id || profile._id}</p>
      <p>— Kresla B2B Team</p>
    `,
  })
}

/** Notify partner when approved */
export function emailB2BApproved({ user, profile }) {
  const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/designer-portal/dashboard`
  const manager = profile.accountManager?.name
    ? profile.accountManager
    : getAccountManagerById(profile.preferredAccountManager)

  queueEmail({
    to: user.email,
    subject: 'Your B2B account is approved — Kresla Furniture',
    html: `
      <p>Dear ${applicantName(user)},</p>
      <p>Great news! <strong>${profile.companyName}</strong> has been verified for Kresla B2B wholesale access.</p>
      <p><strong>Credit terms:</strong> ${profile.creditTerms || 'prepay'}</p>
      <p><strong>Your account manager:</strong> ${manager.name} — ${manager.email} · ${manager.phone}</p>
      <p><a href="${portalUrl}">Log in to the B2B portal</a> to browse wholesale pricing and place orders.</p>
      <p>— Kresla B2B Team</p>
    `,
  })
}

/** Notify applicant when rejected */
export function emailB2BRejected({ user, profile }) {
  queueEmail({
    to: user.email,
    subject: 'B2B application update — Kresla Furniture',
    html: `
      <p>Dear ${applicantName(user)},</p>
      <p>We were unable to approve the B2B application for <strong>${profile.companyName}</strong> at this time.</p>
      ${profile.rejectedReason ? `<p><strong>Reason:</strong> ${profile.rejectedReason}</p>` : ''}
      <p>You may re-submit updated documents from the B2B registration page or contact us at b2b@kresla.uz.</p>
      <p>— Kresla B2B Team</p>
    `,
  })
}
