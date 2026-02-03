import { Resend } from 'resend'

// Initialize Resend lazily to allow build without API key
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

export interface WelcomeEmailData {
  guardianName: string
  guardianEmail: string
  clubName: string
  clubEmail: string
  players: {
    name: string
    division: string
  }[]
  totalPaid: string
  practiceLocation?: string
  practiceSchedule?: string
  documentsComplete: boolean
  documentsUploadUrl?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const resend = getResend()

  const playerList = data.players
    .map(p => `• ${p.name} (${p.division})`)
    .join('\n')

  const documentsSection = data.documentsComplete
    ? ''
    : `
<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
  <h3 style="margin: 0 0 8px 0; color: #92400e;">📄 Action Required: Upload Documents</h3>
  <p style="margin: 0 0 12px 0; color: #78350f;">
    Please upload headshot photos and proof of date of birth for your player(s) within 48 hours.
  </p>
  <a href="${data.documentsUploadUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
    Upload Documents
  </a>
</div>
`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2361; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${data.clubName}! 🏉</h1>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hi ${data.guardianName},</p>

    <p>Thank you for registering with ${data.clubName}! We're excited to have your player(s) join us this season.</p>

    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #374151;">Registration Confirmed</h3>
      <p style="margin: 0; white-space: pre-line;"><strong>Player(s):</strong>
${playerList}</p>
      <p style="margin: 12px 0 0 0;"><strong>Amount Paid:</strong> ${data.totalPaid}</p>
    </div>

    ${documentsSection}

    <h3 style="color: #374151;">What Happens Next?</h3>
    <ol style="color: #4b5563; padding-left: 20px;">
      <li>We'll handle your USA Rugby and SoCal Youth Rugby registrations</li>
      <li>You'll receive a confirmation once everything is processed</li>
      <li>Show up to practice ready to play!</li>
    </ol>

    ${data.practiceLocation ? `
    <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px 0; color: #065f46;">📍 Practice Info</h3>
      <p style="margin: 0; color: #047857;">
        <strong>Location:</strong> ${data.practiceLocation}<br>
        ${data.practiceSchedule ? `<strong>Schedule:</strong> ${data.practiceSchedule}` : ''}
      </p>
    </div>
    ` : ''}

    <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      Questions? Reply to this email or contact us at <a href="mailto:${data.clubEmail}" style="color: #2563eb;">${data.clubEmail}</a>
    </p>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
      This email was sent by Rugby Register on behalf of ${data.clubName}.
    </p>
  </div>
</body>
</html>
`

  const { data: result, error } = await resend.emails.send({
    from: `${data.clubName} <registrations@rugby-register.com>`,
    to: data.guardianEmail,
    subject: `Welcome to ${data.clubName}! Registration Confirmed 🏉`,
    html,
  })

  if (error) {
    console.error('Failed to send welcome email:', error)
    throw new Error('Failed to send welcome email')
  }

  return result
}
